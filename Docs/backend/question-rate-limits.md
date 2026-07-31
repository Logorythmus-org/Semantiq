# Question Rate Limits

The local fixed-window defaults per minute are create 30, update 60, relation 60, semantic 30, source 30, report 10, search 120, graph 60, moderation 60.

Keys are hashed in memory, buckets cap at 10,000, and errors expose only operation and retry seconds. `QUESTION_RATE_LIMIT_DISABLED=1` is the explicit local override. This is not presented as distributed production enforcement.
