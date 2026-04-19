# Test Output Handling

## PowerShell Compatibility

When running `npm run test:run 2>&1` or any test commands:

- **DO NOT** use `head`, `tail`, or any Unix-style output limiting commands
- **DO NOT** pipe output through truncation utilities
- **DO NOT** attempt to limit output lines programmatically

These commands do not work reliably in PowerShell and will cause test output to be lost or incomplete.

### Correct Approach

Always capture and display the **complete, untruncated output** from test runs. If output is large:
- Return all output as-is
- Let the user handle scrolling or filtering in their terminal
- Document any important findings from the full output

### Why This Matters

PowerShell has different command piping behavior than bash. Truncation commands that work in bash may:
- Fail silently in PowerShell
- Produce unexpected results
- Cause loss of critical test failure information

The full test output is essential for debugging and understanding test failures.
