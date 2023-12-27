import chalk from "chalk";

export function info(str: string) {
  console.log(chalk.bgBlue(" INFO "), str);
}

export function warn(str: string) {
  console.log(chalk.bgYellow(" WARN "), chalk.yellowBright(str));
}

export function error(str: string) {
  console.log(chalk.bgRed(" ERROR "), chalk.redBright(str));
}
