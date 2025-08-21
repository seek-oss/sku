import chalk from 'chalk';

export const banner = (
  type: 'info' | 'success' | 'warning' | 'error',
  title: string,
  messages: string[] = [],
) => {
  const colorMap = {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
  };

  const color = colorMap[type];
  let icon = 'ℹ️';
  if (type === 'success') {
    icon = '✅';
  } else if (type === 'error') {
    icon = '❌';
  }

  console.log();
  console.log(color(`${icon} ${title}`));

  if (messages.length > 0) {
    console.log();
    messages.forEach((message) => {
      console.log(`  ${message}`);
    });
  }

  console.log();
};
