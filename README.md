# latex-input

This extension allows you to enter Unicode symbols using LaTeX-like commands. Available commands are added to the list of auto-completions when you type `\`.

## Configuration

* `latex-input.enabled`: Enables or disables the extension. This can be set on a per-language basis. For example:

  ```js
  "[latex]": {
    "latex-input.enabled": false
  }
  ```

* `latex-input.triggers`: The set of characters to watch for to activate the extension. By default this is `'\\'`.

* `latex-input.mappings`: Defines the available input mappings, i.e., which strings get translated into which unicode characters. This can be one of three things:

  1. A JSON object with specific mappings:

      ```js
      "latex-input.mappings": {
        "pm": "±",
        "mp": "∓",
        "times": "×",
        "x": "×",
        "cdot": "⋅",
        ...
      }
      ```

  2. A filename pointing to a JSON file with the desired configuration:

      ```js
      "latex-input.mappings": "${workspaceFolder}my-mappings.json"
      ```

      ```js
      // ${workspaceFolder}my-mappings.json
      {
        "pm": "±",
        "mp": "∓",
        "times": "×",
        "x": "×",
        "cdot": "⋅",
        ...
      }
      ```

      Relative filenames are always resolved with respect to the extension's own directory, which contains a `"default-mappings.json"`.

  3. An array of filenames and JSON objects:

      ```js
      "latex-input.mappings": [
        {...},
        "${workspaceFolder}my-mappings.json"
      ]
      ```
