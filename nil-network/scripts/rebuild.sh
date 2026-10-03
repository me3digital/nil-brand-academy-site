#!/bin/sh
# Forces a staging rebuild when only database content changed (Netlify skips commits that touch nothing in nil-network/).
R=/home/claude/me3digital/nil-brand-academy-site
date -u +"%Y-%m-%dT%H:%M:%SZ $1" > /home/claude/nil-network/.rebuild
cp /home/claude/nil-network/.rebuild "$R/nil-network/.rebuild"
cd "$R" && git add nil-network/.rebuild && git commit -q -m "nil-network: rebuild staging ($1)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01XBnEGqpdZBUSDjfoSLMKFC" && git push -q origin feature/nil-intelligence-network && git log --oneline -1
