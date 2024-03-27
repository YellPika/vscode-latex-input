'use strict';

import { readFileSync } from 'fs';
import {
  ExtensionContext,
  languages,
  workspace,
  Range,
  CompletionItemProvider,
  CompletionItem,
  CompletionItemKind
} from 'vscode';

export function activate(context: ExtensionContext) {
  let completionProvider: CompletionItemProvider = {
    async provideCompletionItems(document, position, token, {triggerCharacter}) {
      let config = workspace.getConfiguration('latex-input', document);
      if (!config.enabled || config.triggers.indexOf(triggerCharacter) === -1) {
        return [];
      }

      let range = new Range(position.translate(0, -1), position);
      let completions: Array<CompletionItem> = [];

      type Mappings = { [key: string]: string };
      function load(obj: string | Mappings | (string | Mappings)[]) {
        if (typeof obj === "string") {
          let filename = context.asAbsolutePath(obj);
          load(JSON.parse(readFileSync(filename).toString()));
        } else if (obj instanceof Array) {
          obj.forEach(load);
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

      load(config.mappings);

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
