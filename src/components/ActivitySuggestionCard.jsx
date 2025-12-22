import React, { useState } from "react";
import { Edit2, MapPin, Save, Sparkles, Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

// Helper function to create a short summary from description
function getDescriptionSummary(description) {
  if (!description) return "";

  // Get first sentence or first 100 characters
  const firstSentence = description.split(/[.!?]/)[0];
  if (firstSentence.length <= 100) {
    return firstSentence + (description.includes('.') || description.includes('!') || description.includes('?') ? '.' : '...');
  }

  return description.substring(0, 100) + "...";
}

// Lightweight card used inside the planner to present AI suggestions.
export default function ActivitySuggestionCard({
  suggestion,
  onEdit,
  onSave,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summary = getDescriptionSummary(suggestion.description);
  const hasLongDescription = suggestion.description && suggestion.description.length > 100;

  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 shadow-sm space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Sparkles size={16} className="text-emerald-500" />
            <span>{suggestion.title}</span>
          </div>
          {suggestion.topic ? (
            <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 inline-flex px-2 py-0.5 rounded-full font-semibold mt-1">
              {suggestion.topic}
            </div>
          ) : null}
        </div>
        <div className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-full">
          AI idea
        </div>
      </div>

      {/* Description with expand/collapse */}
      <div>
        <div
          className={`text-sm text-slate-600 leading-relaxed ${
            isExpanded ? "max-h-48 overflow-y-auto pr-2" : ""
          }`}
          style={isExpanded ? {
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          } : {}}
        >
          {isExpanded ? suggestion.description : summary}
        </div>

        {hasLongDescription && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-1 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={14} /> Show less
              </>
            ) : (
              <>
                <ChevronDown size={14} /> Read more
              </>
            )}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-slate-200">
          <Clock size={12} /> {suggestion.time || "TBD"}
        </span>
        {suggestion.location ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-slate-200">
            <MapPin size={12} /> {suggestion.location}
          </span>
        ) : null}
        {suggestion.duration ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white border border-slate-200">
            {suggestion.duration}
          </span>
        ) : null}
      </div>

      {/* Event link - always available now with smart URLs */}
      {suggestion.eventUrl && (
        <a
          href={suggestion.eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          <ExternalLink size={12} /> Find details & book tickets
        </a>
      )}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={() => onEdit?.(suggestion)}
          className="w-full bg-white border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
        >
          <Edit2 size={14} /> Edit
        </button>
        <button
          onClick={() => onSave?.(suggestion)}
          className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
        >
          <Save size={14} /> Save privately
        </button>
      </div>
    </div>
  );
}

