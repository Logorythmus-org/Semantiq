# Question Runtime Domain Map

The Question aggregate owns identity, text, language, creator, lifecycle, and version. Immutable Question revisions record mutation. QuestionRelation owns typed graph edges and active/removed lifecycle. The Question Frame is the existing semantic structure aggregate with an independent version and Question-version freshness reference. Safety owns source references, reports, moderation cases/actions/state, audit, and observable trust signals.
