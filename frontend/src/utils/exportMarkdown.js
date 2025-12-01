/**
 * Export conversation to Markdown format
 * 
 * Generates a well-structured Markdown document with:
 * - Stage 3 (Final Answer) prominently at the top
 * - Stage 1 (Individual Responses) as an appendix
 * - Stage 2 (Peer Rankings) as an appendix
 */

function getModelShortName(model) {
  return model.split('/')[1] || model;
}

function deAnonymizeText(text, labelToModel) {
  if (!labelToModel) return text;

  let result = text;
  Object.entries(labelToModel).forEach(([label, model]) => {
    const modelShortName = getModelShortName(model);
    result = result.replace(new RegExp(label, 'g'), `**${modelShortName}**`);
  });
  return result;
}

/**
 * Export a single message (user question + council response) to Markdown
 */
function exportMessageToMarkdown(msg, messageIndex) {
  const lines = [];

  if (msg.role === 'user') {
    lines.push(`## Question`);
    lines.push('');
    lines.push(msg.content);
    lines.push('');
    return lines.join('\n');
  }

  // Assistant message with stages
  if (msg.stage3) {
    lines.push(`## Final Council Answer`);
    lines.push('');
    lines.push(`*Chairman: ${getModelShortName(msg.stage3.model)}*`);
    lines.push('');
    lines.push(msg.stage3.response);
    lines.push('');
  }

  // Stage 1 - Individual Responses (Appendix)
  if (msg.stage1 && msg.stage1.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Appendix A: Individual Model Responses');
    lines.push('');

    msg.stage1.forEach((resp, idx) => {
      lines.push(`### ${getModelShortName(resp.model)}`);
      lines.push('');
      lines.push(`*Full model: ${resp.model}*`);
      lines.push('');
      lines.push(resp.response);
      lines.push('');
    });
  }

  // Stage 2 - Peer Rankings (Appendix)
  if (msg.stage2 && msg.stage2.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Appendix B: Peer Rankings');
    lines.push('');

    const labelToModel = msg.metadata?.label_to_model;
    const aggregateRankings = msg.metadata?.aggregate_rankings;

    // Aggregate rankings first (the important summary)
    if (aggregateRankings && aggregateRankings.length > 0) {
      lines.push('### Aggregate Rankings (Street Cred)');
      lines.push('');
      lines.push('Combined results across all peer evaluations (lower score is better):');
      lines.push('');
      aggregateRankings.forEach((agg, idx) => {
        lines.push(`${idx + 1}. **${getModelShortName(agg.model)}** — Avg: ${agg.average_rank.toFixed(2)} (${agg.rankings_count} votes)`);
      });
      lines.push('');
    }

    // Individual evaluations
    lines.push('### Individual Evaluations');
    lines.push('');
    lines.push('*Each model evaluated all responses (originally anonymized). Model names shown in bold for readability.*');
    lines.push('');

    msg.stage2.forEach((rank, idx) => {
      lines.push(`#### Evaluator: ${getModelShortName(rank.model)}`);
      lines.push('');
      lines.push(deAnonymizeText(rank.ranking, labelToModel));
      lines.push('');

      if (rank.parsed_ranking && rank.parsed_ranking.length > 0) {
        lines.push('**Extracted Ranking:**');
        rank.parsed_ranking.forEach((label, i) => {
          const modelName = labelToModel && labelToModel[label]
            ? getModelShortName(labelToModel[label])
            : label;
          lines.push(`${i + 1}. ${modelName}`);
        });
        lines.push('');
      }
    });
  }

  return lines.join('\n');
}

/**
 * Export entire conversation to Markdown
 */
export function exportConversationToMarkdown(conversation) {
  const lines = [];

  // Header
  lines.push('# LLM Council Conversation');
  lines.push('');

  if (conversation.title) {
    lines.push(`**Topic:** ${conversation.title}`);
    lines.push('');
  }

  if (conversation.created_at) {
    const date = new Date(conversation.created_at).toLocaleString();
    lines.push(`**Date:** ${date}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Process each message pair
  conversation.messages.forEach((msg, idx) => {
    lines.push(exportMessageToMarkdown(msg, idx));
  });

  return lines.join('\n');
}

/**
 * Export only Stage 3 (Final Answer) - for quick summary export
 */
export function exportStage3OnlyToMarkdown(conversation) {
  const lines = [];

  // Header
  lines.push('# LLM Council — Final Answers');
  lines.push('');

  if (conversation.title) {
    lines.push(`**Topic:** ${conversation.title}`);
    lines.push('');
  }

  if (conversation.created_at) {
    const date = new Date(conversation.created_at).toLocaleString();
    lines.push(`**Date:** ${date}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  conversation.messages.forEach((msg, idx) => {
    if (msg.role === 'user') {
      lines.push(`## Question`);
      lines.push('');
      lines.push(msg.content);
      lines.push('');
    } else if (msg.stage3) {
      lines.push(`## Answer`);
      lines.push('');
      lines.push(`*Chairman: ${getModelShortName(msg.stage3.model)}*`);
      lines.push('');
      lines.push(msg.stage3.response);
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  });

  return lines.join('\n');
}

/**
 * Trigger download of text content as a file
 */
export function downloadAsFile(content, filename) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate a safe filename from conversation title
 */
export function generateFilename(conversation, suffix = '') {
  const base = conversation.title
    ? conversation.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50)
    : 'llm-council';

  const date = conversation.created_at
    ? new Date(conversation.created_at).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return `${date}-${base}${suffix}.md`;
}
