# Habloo Prototype Workflow

All experimental UI and feature ideas must be built inside `src/prototypes` first.

Production screens should not be modified directly during experimentation:
- `src/components/HomeScreen.jsx`
- `src/components/Phase1Listen.jsx`
- `src/components/Phase2Speak.jsx`
- `src/components/Phase3Grammar.jsx`
- `src/components/AIChat.jsx`
- `src/App.jsx`

Prototypes may use backend fetch utilities, content endpoints, and local data to prove an idea.

After a prototype is approved, it can be integrated carefully into production screens with a focused task and regression check.
