/**
 * EndScreen — Displayed when the player reaches an ending node.
 *
 * Shows the ending title, a summary of the path taken,
 * and options to restart or explore a different path.
 */

import { useMemo, type FC } from "react";
import type { StoryNode, HistoryEntry } from "../types/story";
import { analyticsCollector } from "../utils/analyticsCollector";
import "./EndScreen.css";

export interface EndScreenProps {
  /** The ending node that was reached. */
  endingNode: StoryNode;

  /** The player's full history of visited nodes. */
  history: readonly HistoryEntry[];

  /** Total number of nodes in the story (for completion context). */
  totalNodes: number;

  /** Story key for analytics lookup. */
  storyKey?: string;

  /** Callback to restart the story. */
  onRestart: () => void;
}

export const EndScreen: FC<EndScreenProps> = ({
  endingNode,
  history,
  totalNodes,
  storyKey,
  onRestart,
}) => {
  const uniqueNodesVisited = new Set(history.map((h) => h.nodeId)).size;
  const explorationPct = Math.round((uniqueNodesVisited / totalNodes) * 100);

  const analyticsSummary = useMemo(() => {
    if (!storyKey) return null;
    const analytics = analyticsCollector.getAnalytics(storyKey);
    if (analytics.totalPlaythroughs === 0) return null;
    
    const endingStats = analyticsCollector.getEndingStats(analytics);
    const yourEnding = endingStats.find((e) => e.endingNodeId === endingNode.id);
    
    return {
      totalPlaythroughs: analytics.totalPlaythroughs,
      yourEndingPct: yourEnding?.percentage ?? 0,
      endingStats,
    };
  }, [storyKey, endingNode.id]);

  return (
    <div className="end-screen">
      <div className="end-screen__content">
        <div className="end-screen__badge">THE END</div>

        <h1 className="end-screen__title">{endingNode.title}</h1>

        {endingNode.subtitle && (
          <p className="end-screen__subtitle">{endingNode.subtitle}</p>
        )}

        <div className="end-screen__stats">
          <div className="end-screen__stat">
            <span className="end-screen__stat-value">{history.length}</span>
            <span className="end-screen__stat-label">Scenes Watched</span>
          </div>
          <div className="end-screen__stat">
            <span className="end-screen__stat-value">
              {uniqueNodesVisited}
            </span>
            <span className="end-screen__stat-label">Unique Nodes</span>
          </div>
          <div className="end-screen__stat">
            <span className="end-screen__stat-value">{explorationPct}%</span>
            <span className="end-screen__stat-label">Explored</span>
          </div>
        </div>

        <div className="end-screen__actions">
          <button className="end-screen__btn end-screen__btn--primary" onClick={onRestart}>
            Play Again
          </button>
        </div>

        {explorationPct < 100 && (
          <p className="end-screen__hint">
            You explored {explorationPct}% of the story. Try different choices
            to discover new paths and endings.
          </p>
        )}

        {analyticsSummary && analyticsSummary.totalPlaythroughs > 1 && (
          <div className="end-screen__analytics">
            <p className="end-screen__analytics-title">
              This ending has been reached by {analyticsSummary.yourEndingPct}% of {analyticsSummary.totalPlaythroughs} playthroughs
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
