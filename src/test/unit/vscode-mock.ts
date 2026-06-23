/**
 * Minimal `vscode` module stub for unit tests that run in plain Node (mocha),
 * outside the VS Code extension host. Only the surface actually used by the
 * pure utility modules under test is implemented.
 */

/** Stand-in for vscode.MarkdownString that records appended content. */
export class MarkdownString {
  value = '';
  supportHtml = false;
  isTrusted = false;

  constructor(value?: string) {
    if (value) {
      this.value = value;
    }
  }

  appendText(text: string): MarkdownString {
    this.value += text;
    return this;
  }

  appendMarkdown(markdown: string): MarkdownString {
    this.value += markdown;
    return this;
  }

  appendCodeblock(code: string, language = ''): MarkdownString {
    this.value += '```' + language + '\n' + code + '\n```';
    return this;
  }
}

/** Stand-in for vscode.ThemeColor. */
export class ThemeColor {
  constructor(public readonly id: string) {}
}

/** Stand-in for vscode.ThemeIcon. */
export class ThemeIcon {
  static readonly File = new ThemeIcon('file');
  static readonly Folder = new ThemeIcon('folder');
  constructor(
    public readonly id: string,
    public readonly color?: ThemeColor
  ) {}
}

export const Uri = {
  file(path: string): { fsPath: string; path: string; scheme: string } {
    return { fsPath: path, path, scheme: 'file' };
  },
};

export enum StatusBarAlignment {
  Left = 1,
  Right = 2,
}

export enum TreeItemCollapsibleState {
  None = 0,
  Collapsed = 1,
  Expanded = 2,
}

export const workspace = {
  workspaceFolders: undefined as unknown,
  getConfiguration() {
    return {
      get: <T>(_key: string, defaultValue?: T): T | undefined => defaultValue,
    };
  },
};

export const window = {
  createStatusBarItem() {
    return {
      text: '',
      tooltip: '',
      command: undefined,
      color: undefined,
      show() {},
      hide() {},
      dispose() {},
    };
  },
};

export const commands = {
  async executeCommand() {
    return undefined;
  },
};
