# Contributing

When you are ready to start work on your own feature and would like to push it to the main repository. Follow these guidelines.

1. Clone the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'update/your-update'`) please use the following for your commits:
    i. `update/your-update`
    ii. `fix/your-fix`
    iii. `refactor/your-refactor` (Refactoring code, doesn't change behavior) iv. `change/your-change` (Changing existing code behavior)
    Push to the Branch (git push origin update/AmazingFeature)
    Open a Pull Request

Do keep in mind of the `package.json` version. Version structure is as follows: `(major).(minor).(patch)`

***Major***
> Major versions should rarely change. A change in major version means its incompatible with the previouse major version.

***Minor***
> Will be your feature update(s). Large code refactors

***Patch***
> Small code refactors and Bug fixes. (If you merge your branch into main and need to make bug fixes, etc. create a *NEW* branch)

# Style Guide

* Indent using 4 spaces
* Use main branch for production
* Never use `var` only `let` or `const`
* Give any functions you write a Javadoc comment. (There is a JavaScript way of doing it) (They will check for comments at the end of the sem.)
* Follow the above guide for branches and commits
* Camel case variables with good names
* Any keys or sensitive information must go in a `.env` file. Update the `.env.example` to show which keys are required.