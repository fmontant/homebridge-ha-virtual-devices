# Troubleshooting

This guide describes common issues that may occur while developing, releasing or deploying **Homebridge HA Virtual Devices**.

It is intended for maintainers and contributors who encounter unexpected behaviour during the development workflow.

After reading this guide, you should be able to identify the most common problems and apply the appropriate solution.

---

## General Approach

When an issue occurs:

1. Read the complete error message.
2. Identify the step that failed.
3. Verify the project state.
4. Apply the recommended solution.
5. Retry the operation.

Avoid bypassing validation checks. They are designed to prevent inconsistent releases.

---

## The Repository Is Not Clean

### Symptoms

The toolkit refuses to continue before starting a release.

### Cause

The Git working tree contains modified or untracked files.

### Solution

Check the repository status.

```bash
git status
```

Commit, stash or discard the remaining changes before running the toolkit again.

---

## The Repository Is Not Synchronized

### Symptoms

The release preparation stops with a synchronization error.

### Cause

The local repository is ahead of or behind the remote repository.

### Solution

Synchronize the repository.

```bash
git pull

git push
```

Verify that both repositories are synchronized before retrying.

---

## npm Authentication Failed

### Symptoms

The release process stops before publication.

### Cause

The current user is not authenticated with npm.

### Solution

Authenticate again.

```bash
npm login
```

Verify the authentication.

```bash
npm whoami
```

---

## Build Failed

### Symptoms

The project cannot be compiled.

### Cause

One or more source files contain errors.

### Solution

Run the build manually.

```bash
npm run build:all
```

Correct every reported error before continuing.

---

## Lint Failed

### Symptoms

The quality checks fail.

### Cause

The source code does not comply with the project's coding standards.

### Solution

Run:

```bash
npm run lint
```

Correct every reported issue before preparing a release.

---

## Publication Failed

### Symptoms

The package is not published on npm.

### Cause

The release process was interrupted before completion.

### Solution

Review the complete output produced by the toolkit.

Correct the reported problem before restarting the publication process.

Never attempt to publish a partially prepared release manually.

---

## Deployment Failed

### Symptoms

The plugin does not start after installation.

### Cause

The deployment was incomplete or the installed package is incorrect.

### Solution

Verify:

- the published version;
- the installed package;
- the Homebridge logs;
- the plugin configuration.

Redeploy the package if necessary.

---

## Still Having Problems?

If the issue cannot be resolved:

- collect the complete console output;
- identify the failed step;
- describe the actions that produced the issue;
- include the relevant error messages when reporting the problem.

Providing complete diagnostic information significantly reduces troubleshooting time.
