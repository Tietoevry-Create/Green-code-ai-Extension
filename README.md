# Green Code AI Extension

The Green Code AI extension enhances your Visual Studio Code experience by integrating with Green Code AI services, providing advanced code analysis capabilities.

## Features

The Green Code AI extension provides the following features:

- **Code Analysis**: Leverage the power of Green Code AI to analyze your code for best practices, potential issues, and improvements.
- **Secure Configuration**: Safely store and manage your OpenAI API key and other sensitive information using VS Code's secure storage.

## Contributing

We welcome contributions from everyone. Here are a few ways you can help:

1. **Fork the repository**: Start by forking the project repository to your own GitHub account.

2. **Clone the repository**: Clone the forked repository to your local machine.

   ```
   git clone https://github.com/<your-username>/<repository-name>.git
   ```

3. **Create a new branch**: Create a new branch for your changes. This helps to keep the work organized.

   ```
   git checkout -b <branch-name>
   ```

4. **Make your changes**: Make the changes or additions in your local project. Be sure to test your changes!

5. **Commit your changes**: Once you've made changes, commit them with a clear and descriptive commit message.

   ```
   git commit -m "<your-commit-message>"
   ```

6. **Push to your fork**: Push your changes to the forked repository on GitHub.

   ```
   git push origin <branch-name>
   ```

7. **Submit a pull request**: Go to your forked repository on GitHub and click the "New pull request" button. Fill out the form and then submit the pull request for review.

Thank you for your interest in contributing to our project!

## Local development and testing

For testing the application locally, follow these steps:

#### Compile and build the project

1.  **Compile the project**:

    ```
    npm run compile
    ```

    You should now see the `out` folder appear at you root directory.

2.  **Build the project**:

    ```
    npm run build
    ```

#### Test the VS Code extension

1. **Install `vsce`**, a command-line tool for packaging, publishing and managing VS Code extensionsn [vsce](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#vsce):

   ```
   npm install -g @vscode/vsce
   ```

2. **Create a package of the extension**, a `.vsix` file of the extension is created:

   ```
   vsce package
   ```

3. **Install the extension**:

   - Go to the Extensions view.
   - Click **Views and more actions** in the upper right corner.
   - Select **Install from VSIX**.
   - Install the `green-code-ai-1.0.0.vsix` file.

4. **Click on the new extension in the left bar and test it on some code!**

## Reporting Bugs

If you encounter a bug while using our project, we would appreciate it if you could report it to us. Here's how you can do it:

1. **Check existing issues**: Before creating a new issue, please check our issue tracker to see if someone else has already reported the same bug. If it's already reported, you can add your information to the existing issue.

2. **Create a new issue**: If the bug hasn't been reported yet, create a new issue in our issue tracker. Please provide as much information as possible to help us understand and reproduce the bug. Here's what we would like to know:

   - A clear and descriptive title.
   - Steps to reproduce the bug.
   - Expected behavior.
   - Actual behavior.
   - Screenshots or screen recordings (if applicable).
   - Your operating system, browser version, and project version.

3. **Submit the issue**: Once you've filled out all the necessary information, submit the issue.

We appreciate your help in making our project better. Thank you for taking the time to report bugs!

## License

This project is licensed under the [MIT License](license.md). Please see the [license.md](license.md) file for the full text.

<br />

**Enjoy coding sustainably with Green-Code-AI!**

© Tietotevry Corporation (2024)
