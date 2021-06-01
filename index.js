#!/usr/bin/env node

const fs = require('fs');
const inquirer = require('inquirer');
const faker = require('faker');
const md5 = require('md5');
const shajs = require('sha.js');

const questions = [
  {
    type: 'input',
    name: 'name',
    message: 'Название файла',
    default: '<date>_<type>_<count>.txt',
    validate: value => (value.length ? true : 'Обязательно к заполнению')
  },
  {
    type: 'list',
    name: 'type',
    message: 'Тип данных?',
    choices: [
      { name: 'UUID', value: 'uuid' },
      { name: 'MD5', value: 'md5' },
      { name: 'SHA256', value: 'sha256' },
      { name: 'Телефонные номера', value: 'msisdn' },
      { name: 'Электронные почты', value: 'email' },
      { name: 'MAC-адреса', value: 'mac' }
    ]
  },
  {
    type: 'list',
    name: 'limitBy',
    message: 'Ограничение по',
    choices: [
      { name: 'количеству строк', value: 'count' },
      { name: 'размеру', value: 'size' }
    ]
  },
  {
    type: 'input',
    name: 'count',
    message: 'Количество строк?',
    validate: value =>
      Number.isNaN(parseFloat(value)) ? 'Неверное число' : true,
    filter: value => (Number.isNaN(parseInt(value)) ? '' : parseInt(value)),
    when: ({ limitBy }) => limitBy === 'count'
  },
  {
    type: 'input',
    name: 'size',
    message: 'Максимальный размер в байтах?',
    validate: value =>
      Number.isNaN(parseFloat(value)) ? 'Неверное число' : true,
    filter: value => (Number.isNaN(parseInt(value)) ? '' : parseInt(value)),
    when: ({ limitBy }) => limitBy === 'size'
  }
];

const getLineByType = type => {
  let string = '';

  switch (type) {
    case 'uuid':
      string = faker.datatype.uuid();
      break;

    case 'md5':
      string = md5(faker.datatype.uuid());
      break;

    case 'sha256':
      string = shajs('sha256').update(faker.datatype.uuid()).digest('hex');
      break;

    case 'msisdn':
      string = faker.phone.phoneNumber('79#########');
      break;

    case 'email':
      string = faker.internet.email();
      break;

    case 'mac':
      string = faker.internet.mac();
      break;
  }

  return `${string}\n`;
};

inquirer.prompt(questions).then(answers => {
  let lineCount = answers.count;
  if (!lineCount) {
    const line = getLineByType(answers.type);
    lineCount = parseInt(answers.size / line.length);
  }

  const name = answers.name
    .replace('<date>', new Date().toISOString())
    .replace('<type>', answers.type)
    .replace('<count>', lineCount);

  var ui = new inquirer.ui.BottomBar();

  ui.updateBottomBar('Генерация началась');

  const fd = fs.openSync(name, 'a');

  for (let index = 0; index < lineCount; index++) {
    const string = getLineByType(answers.type);

    fs.appendFileSync(fd, string, 'utf8');

    const percent = 100 / (lineCount / index);
    if (percent % 10 === 0) {
      ui.updateBottomBar('#'.repeat((percent / 10) * 2).padEnd(20, '-'));
    }
  }

  ui.updateBottomBar(`Генерация завершена: ${name}`);
  fs.closeSync(fd);

  process.exit();
});
