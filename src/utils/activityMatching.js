/**
 * Finds an activity in the user's upcoming activities list by matching various id fields.
 * Handles complex matching scenarios where activities may have both id and sourceId fields.
 *
 * @param {Object} activity - The activity to find
 * @param {Array} upcomingActivities - The user's list of upcoming activities
 * @returns {Object|undefined} The matching activity from upcomingActivities, or undefined if not found
 */
export function findUpcomingActivity(activity, upcomingActivities = []) {
  if (!activity) return undefined;

  const targetId = activity?.sourceId || activity?.id;

  return upcomingActivities.find((a) => {
    // Direct id match
    if (a.id === activity.id) return true;
    // SourceId of upcoming matches id of activity (most common case)
    if (a.sourceId === activity.id) return true;
    if (a.sourceId === targetId) return true;
    // Id of upcoming matches sourceId of activity
    if (a.id === activity.sourceId) return true;
    if (a.id === targetId) return true;
    // Both have sourceIds that match
    if (a.sourceId && activity.sourceId && a.sourceId === activity.sourceId) return true;
    return false;
  });
}
