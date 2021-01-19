'use strict';

import { readFileSync } from 'fs';
import {
  ExtensionContext,
  commands,
  languages,
  workspace,
  Range,
  CompletionItemProvider,
  CompletionItem,
  CompletionItemKind
} from 'vscode';

export function activate(context: ExtensionContext) {
  type Mappings = { [key: string]: string };

  let mappings: Mappings;

  function reloadMappings() {
    function load(obj: string | Mappings | (string | Mappings)[]): Mappings {
      if (typeof obj === "string") {
        let filename = context.asAbsolutePath(obj);
        return JSON.parse(readFileSync(filename).toString());
      } else if (obj instanceof Array) {
        let result: Mappings = {};
        obj.forEach(value => {
          result = { ...result, ...load(value) };
        });
        return result;
      } else {
        return obj;
      }
    }

    let config = workspace.getConfiguration('latex-input');
    mappings = load(config.mappings);
  }

  let completionProvider: CompletionItemProvider = {
    async provideCompletionItems(document, position, token, context) {
      let config = workspace.getConfiguration('latex-input');
      if (config.triggers.indexOf(context.triggerCharacter) === -1) {
        return [];
      }

      let range = new Range(position.translate(0, -1), position);
      let completions: Array<CompletionItem> = [];
      for (const from in mappings) {
        let to: string = mappings[from];
        let item = new CompletionItem(context.triggerCharacter + from);
        item.detail = to;
        item.kind = CompletionItemKind.Text;
        item.insertText = to;
        item.range = range;
        completions.push(item);
      }

      return completions;
    }
  };

  function registerCompletionProvider() {
    let config = workspace.getConfiguration('latex-input');
    return languages.registerCompletionItemProvider(
      config.selector,
      completionProvider,
      ...config.triggers);
  }

  reloadMappings();

  let registration = registerCompletionProvider();

  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("latex-input.mappings")) {
        reloadMappings();
      }

      if (e.affectsConfiguration("latex-input.selector") ||
          e.affectsConfiguration("latex-input.triggers")) {
        registration.dispose();
        registration = registerCompletionProvider();
      }
    }));

  context.subscriptions.push(
    commands.registerCommand(
      'latex-input.reload-mappings',
      reloadMappings));
}
