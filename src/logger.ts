import chalk from "chalk";

export function info(str: string) {
  console.log(chalk.bgBlue(" INFO "), str);
}

export function error(str: string) {
  console.log(chalk.bgRed(" ERROR "), str);
}
