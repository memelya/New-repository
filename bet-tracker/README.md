# Bet Tracker

Win/loss statistics and profit chart for betting activity.

- Updates from `bet-state.json` (polled every 5s)
- Hardcoded fallback data if fetch fails
- Auto-refresh for live updates

## Usage

- Add: `node bet-tracker/update-bets.js --add '{"date":"...","tournament":"...","match":"...","bet":"...","stake":1,"odds":2.0,"result":"pending","pl":"0.00"}'`
- Update: `node bet-tracker/update-bets.js --result 0 '{"result":"won","pl":"+2.80"}'`
