'use strict';

import { isAbsolute } from 'path';
import {
  ExtensionContext,
  languages,
  workspace,
  Range,
  CompletionItemProvider,
  CompletionItem,
  CompletionItemKind,
  Uri
} from 'vscode';

export function activate(context: ExtensionContext) {
  let completionProvider: CompletionItemProvider = {
    async provideCompletionItems(document, position, token, { triggerCharacter }) {
      let config = workspace.getConfiguration('latex-input', document);
      if (!config.enabled || config.triggers.indexOf(triggerCharacter) === -1) {
        return [];
      }

      let range = new Range(position.translate(0, -1), position);
      let completions: Array<CompletionItem> = [];

      type Mappings = { [key: string]: string };
      async function load(obj: string | Mappings | (string | Mappings)[]) {
        if (typeof obj === "string") {
          if (isAbsolute(obj)) {
            try {
              let buffer = await workspace.fs.readFile(Uri.file(obj));
              await load(JSON.parse(buffer.toString()));
            } catch { }
            return;
          }

          if (workspace.workspaceFolders && obj.includes('${workspaceFolder}')) {
            for (let i = 0; i < workspace.workspaceFolders.length; i++) {
              try {
                let uri = Uri.file(obj.replace(
                  '${workspaceFolder}',
                  workspace.workspaceFolders[i].uri.fsPath + '/'));
                let buffer = await workspace.fs.readFile(uri);
                await load(JSON.parse(buffer.toString()));
              } catch { }
            }
            return;
          }

          try {
            let uri = Uri.file(context.asAbsolutePath(obj));
            let buffer = await workspace.fs.readFile(uri);
            await load(JSON.parse(buffer.toString()));
          } catch { }
        } else if (obj instanceof Array) {
          for (const entry of obj)
            await load(entry);
        } else {
          for (const from in obj) {
            let to = obj[from];
            let item = new CompletionItem(triggerCharacter + from);
            item.detail = to;
            item.kind = CompletionItemKind.Text;
            item.insertText = to;
            item.range = range;
            completions.push(item);
          }
        }
      }

      await load(config.mappings);

      return completions;
    }
  };

  function registerCompletionProvider() {
    let config = workspace.getConfiguration('latex-input');
    return languages.registerCompletionItemProvider(
      [{ "scheme": "file" }, { "scheme": "untitled" }],
      completionProvider,
      ...config.triggers);
  }

  let registration = registerCompletionProvider();

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("latex-input.selector") ||
        e.affectsConfiguration("latex-input.triggers")) {
        registration.dispose();
        registration = registerCompletionProvider();
      }
    }));
}
