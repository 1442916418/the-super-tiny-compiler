const { tokenizer, parser, transformer, codeGenerator, compiler } = require('./the-super-tiny-compiler-zh')
const assert = require('assert')

const input = '(add 2 (subtract 4 2))'
const output = 'add(2, subtract(4, 2));'

const tokens = [
  { type: 'paren', value: '(' },
  { type: 'name', value: 'add' },
  { type: 'number', value: '2' },
  { type: 'paren', value: '(' },
  { type: 'name', value: 'subtract' },
  { type: 'number', value: '4' },
  { type: 'number', value: '2' },
  { type: 'paren', value: ')' },
  { type: 'paren', value: ')' }
]

const ast = {
  type: 'Program',
  body: [
    {
      type: 'CallExpression',
      name: 'add',
      params: [
        {
          type: 'NumberLiteral',
          value: '2'
        },
        {
          type: 'CallExpression',
          name: 'subtract',
          params: [
            {
              type: 'NumberLiteral',
              value: '4'
            },
            {
              type: 'NumberLiteral',
              value: '2'
            }
          ]
        }
      ]
    }
  ]
}

const newAst = {
  type: 'Program',
  body: [
    {
      type: 'ExpressionStatement',
      expression: {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'add'
        },
        arguments: [
          {
            type: 'NumberLiteral',
            value: '2'
          },
          {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'subtract'
            },
            arguments: [
              {
                type: 'NumberLiteral',
                value: '4'
              },
              {
                type: 'NumberLiteral',
                value: '2'
              }
            ]
          }
        ]
      }
    }
  ]
}

// tokenizer(input)
parser(tokens)
// transformer(ast)
// codeGenerator(newAst)
// compiler(input)

// assert.deepStrictEqual(tokenizer(input), tokens, 'Tokenizer 应将 `input` 字符串转换为 `tokens` 数组')
// assert.deepStrictEqual(parser(tokens), ast, '解析器应将 `tokens` 数组转换为 `ast` ')
// assert.deepStrictEqual(transformer(ast), newAst, 'Transformer 应该将 `ast` 变成 `newAst`')
// assert.deepStrictEqual(codeGenerator(newAst), output, '代码生成器应该将 `newAst` 转换为 `output` 字符串')
// assert.deepStrictEqual(compiler(input), output, '编译器应将 `输入` 转换为 `输出` ')

// console.log('All Passed!')
