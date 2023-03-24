'use strict'

/**
 * 今天我们要一起写一个编译器。 但不仅仅是任何编译器......
 * 超级 duper 极小的微型编译器！ 一个非常小的编译器，
 * 如果你删除所有注释，此文件只有约 200 行实际代码。
 *
 * 我们将把一些类似 lisp 的函数调用编译成一些类似 C 的函数函数调用。
 *
 * 如果您不熟悉其中一个或另一个。 我会给你一个快速的介绍。
 *
 * 如果我们有两个函数 `add` 和 `subtract` 它们会这样写：
 *
 *                  LISP                      C
 *
 *   2 + 2          (add 2 2)                 add(2, 2)
 *   4 - 2          (subtract 4 2)            subtract(4, 2)
 *   2 + (4 - 2)    (add 2 (subtract 4 2))    add(2, subtract(4, 2))
 *
 * 很简单吧？
 *
 * 很好，因为这正是我们要编译的内容。
 * 虽然这既不是完整的 LISP 语法也不是 C 语法，
 * 它足以用于演示现代编译器的许多主要部分。
 */

/**
 * 大多数编译器分为三个主要阶段：解析、转换和代码生成
 *
 * 1.*Parsing* 是将原始代码转换为更抽象的代码表示。
 *
 * 2.*Transformation* 采用这个抽象表示，并进行操作以执行编译器希望它执行的任何操作。
 *
 * 3.*Code Generation* 采用代码的转换表示，并将其转换为新代码。
 */

/**
 * 解析
 * ------
 *
 * 解析通常分为两个阶段：词法分析和句法分析。
 *
 * 1. *词法分析* 获取原始代码，并通过一个称为标记器（或lexer）的东西将其拆分为这些称为标记的东西。
 *
 *    Tokens 是一组微小的小对象，描述了一个孤立的部分的语法。
 *    它们可以是数字、标签、标点符号、运算符、任何。
 *
 * 2. *句法分析* 获取标记并将它们重新格式化为描述语法各部分及其关系的表示彼此。
 *    这被称为中间表示或抽象语法树。
 *
 *    抽象语法树（Abstract Syntax Tree，简称AST），是一个深度嵌套的对象，
 *    它以一种既易于使用又能告诉我们大量信息的方式表示代码。
 *
 * 对于以下语法：
 *
 *   (add 2 (subtract 4 2))
 *
 * Tokens 可能看起来像这样：
 *
 *   [
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'add'      },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'subtract' },
 *     { type: 'number', value: '4'        },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: ')'        },
 *     { type: 'paren',  value: ')'        },
 *   ]
 *
 * 抽象语法树 (AST) 可能如下所示：
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2',
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4',
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2',
 *         }]
 *       }]
 *     }]
 *   }
 */

/**
 * 转换
 * --------------
 *
 * 编译器的下一个阶段类型是转换。同样，这只是从最后一步中提取AST并对其进行更改。
 * 它可以用相同的语言操作AST，也可以将其翻译成一种全新的语言。
 *
 * 让我们看看如何转换AST。
 *
 * 您可能会注意到，我们的AST中有一些元素看起来非常相似。
 * 这些对象具有类型属性。这些节点中的每一个都被称为AST节点。
 * 这些节点在其上定义了描述树的一个独立部分的财产。
 *
 * 我们可以有一个 NumberLiteral 的节点：
 *
 *   {
 *     type: 'NumberLiteral',
 *     value: '2',
 *   }
 *
 * 或者可能是 CallExpression 的节点：
 *
 *   {
 *     type: 'CallExpression',
 *     name: 'subtract',
 *     params: [...nested nodes go here...],
 *   }
 *
 * 当转换AST时，我们可以通过添加/删除/替换财产来操作节点，
 * 我们可以添加新节点、删除节点，或者我们可以保留现有的AST并基于它创建一个全新的AST。
 *
 * 由于我们的目标是一种新的语言，我们将专注于创建一种针对目标语言的全新AST。
 *
 * 遍历
 * ----------
 *
 * 为了浏览所有这些节点，我们需要能够遍历它们。
 * 这个遍历过程首先到达 AST 深度中的每个节点。
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2'
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4'
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2'
 *         }]
 *       }]
 *     }]
 *   }
 *
 * 所以对于上面的 AST 我们会去：
 *
 * 1. Program - 从 AST 的顶层开始
 * 2. CallExpression (add) - 移动到程序主体的第一个元素
 * 3. NumberLiteral (2) - 移动到表达式参数的第一个元素
 * 4. CallExpression (subtract) - 移动到表达式参数的第二个元素
 * 5. NumberLiteral (4) - 移动到表达式参数的第一个元素
 * 6. NumberLiteral (2) - 移动到表达式参数的第二个元素
 *
 * 如果我们直接操作这个AST，而不是创建一个单独的AST，我们可能会在这里引入各种抽象。
 * 但是，仅仅访问树中的每个节点就足以完成我们要做的工作。
 *
 * 我之所以使用 "visiting" 这个词，是因为有这种模式来表示对象结构元素上的操作。
 *
 * Visiting
 * --------
 *
 * 这里的基本思想是，我们将创建一个访问者对象，该对象具有接受不同节点类型的方法。
 *
 *   var visitor = {
 *     NumberLiteral() {},
 *     CallExpression() {},
 *   };
 *
 *
 * 当我们遍历AST时，每当我们 "enter" 匹配类型的节点时，我们都会调用这个访问者上的方法。
 *
 * 为了使这一点变得有用，我们还将传递节点和对父节点的引用。
 *
 *   var visitor = {
 *     NumberLiteral(node, parent) {},
 *     CallExpression(node, parent) {},
 *   };
 *
 *然而，也存在将事情称为 "exit" 的可能性。想象一下，我们以前的树状结构是列表形式：
 *
 *   - Program
 *     - CallExpression
 *       - NumberLiteral
 *       - CallExpression
 *         - NumberLiteral
 *         - NumberLiteral
 *
 * 当我们向下行进时，我们将到达有尽头的分支。
 * 当我们完成树的每一个分支时，我们 "exit"它。
 * 所以沿着树往下走，我们 "enter" 每个节点，再向上走，我们就 "exit"了。
 *
 *   -> Program (enter)
 *     -> CallExpression (enter)
 *       -> Number Literal (enter)
 *       <- Number Literal (exit)
 *       -> Call Expression (enter)
 *          -> Number Literal (enter)
 *          <- Number Literal (exit)
 *          -> Number Literal (enter)
 *          <- Number Literal (exit)
 *       <- CallExpression (exit)
 *     <- CallExpression (exit)
 *   <- Program (exit)
 *
 * 为了支持这一点，我们访问者的最终形式将如下所示：
 *
 *   var visitor = {
 *     NumberLiteral: {
 *       enter(node, parent) {},
 *       exit(node, parent) {},
 *     }
 *   };
 */

/**
 * Code Generation
 * --------------
 *
 * 编译器的最后阶段是代码生成。
 * 有时编译器会做一些与转换重叠的事情，但在大多数情况下，
 * 代码生成只意味着将我们的 AST 和 string-ify 代码收回。
 *
 * 代码生成器有几种不同的工作方式，一些编译器将重用以前的标记，
 * 另一些编译器将创建单独的代码表示，以便线性打印节点，
 * 但据我所知，大多数编译器将使用我们刚刚创建的相同 AST，这也是我们将要关注的。
 *
 * 实际上，我们的代码生成器将知道如何 "print" AST 的所有不同节点类型，
 * 并且它将递归地调用自己来打印嵌套节点，直到所有内容都打印成一个长代码串。
 */

/**
 * 就这样！这就是编译器的所有不同部分。
 *
 * 这并不是说每个编译器看起来都和我在这里描述的完全一样。
 * 编译器有许多不同的用途，它们可能需要比我详细介绍的更多的步骤。
 *
 * 但现在您应该对大多数编译器的外观有一个大致的高级概念。
 *
 * 既然我已经解释了所有这些，你们都可以去写自己的编译器了，对吧？
 *
 * 开玩笑，这就是我来帮忙的地方
 *
 * 所以让我们开始。。。
 */

/**
 * ============================================================================
 *                                   (/^▽^)/
 *                                THE TOKENIZER!
 * ============================================================================
 */

/**
 * 我们将从语法分析的第一阶段开始，词法分析，使用标记器。
 *
 * 我们只需要把我们的代码串分解成一个令牌数组。
 *
 *   (add 2 (subtract 4 2))   =>   [{ type: 'paren', value: '(' }, ...]
 */

// 我们首先接受输入的代码字符串，然后我们将设置两件事...
function tokenizer(input) {
  // 一个 `current` 变量，用于像光标一样跟踪我们在代码中的位置。
  let current = 0

  // 还有一个 `tokens` 数组，用于保存令牌。
  let tokens = []

  // 我们首先创建一个 `while` 循环来设置我们的 `current`
  // 变量要尽可能多地增加，只要我们想要 `inside` 循环中。
  //
  // 我们这样做是因为我们可能想在一个周期内多次递增 `current`
  // 单循环因为我们的令牌可以是任意长度。
  while (current < input.length) {
    // 我们还将在 `input` 中存储 `current` 字符。
    let char = input[current]

    // 我们要检查的第一件事是否有左括号。这会稍后用于 `CallExpression` 但现在我们只关心字符。
    //
    // 我们检查是否有左括号：
    if (char === '(') {
      // 如果这样做，我们将推送一个类型为 `paren` 的新令牌，并设置值为左括号。
      tokens.push({
        type: 'paren',
        value: '('
      })

      // 然后我们增加 `current`
      current++

      // 然后我们 `continue` 进入循环的下一个周期。
      continue
    }

    // 接下来我们要检查右括号。我们完全一样和以前一样：检查右括号，添加新标记，
    // 增加 `current` 和 `continue`。
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')'
      })
      current++
      continue
    }

    // 继续，我们现在要检查空格。这很有趣
    // 因为我们关心空格的存在是为了分隔字符，但是它 实际上对于我们存储为令牌并不重要。
    // 我们会抛弃它。
    //
    // 所以在这里我们只是要测试是否存在，如果它确实存在我们继续 `continue`。
    let WHITESPACE = /\s/
    if (WHITESPACE.test(char)) {
      current++
      continue
    }

    // 下一种类型的令牌是数字。这与我们之前看到的有所不同，
    // 因为数字可以是任意数量的字符，我们希望将整个字符序列捕获为一个令牌。
    //
    //   (add 123 456)
    //        ^^^ ^^^
    //        只有两个单独的令牌
    //
    // 所以当我们遇到序列中的第一个数字时，我们就开始了。
    let NUMBERS = /[0-9]/
    if (NUMBERS.test(char)) {
      // 我们将创建一个 `value` 字符串，将字符推送到该字符串中。
      let value = ''

      // 然后，我们将循环遍历序列中的每个字符，直到遇到一个不是数字的字符，
      // 将每个数字字符推到我们的 `value` ，并在前进的过程中递增 `current`。
      while (NUMBERS.test(char)) {
        value += char
        char = input[++current]
      }

      // 之后，我们将 `number` 标记推送到 `tokens` 数组。
      tokens.push({ type: 'number', value })

      // 我们继续.
      continue
    }

    // 我们还将在我们的语言中添加对字符串的支持，字符串将是用双引号（"）包围的任何文本。
    //
    //   (concat "foo" "bar")
    //            ^^^   ^^^ string tokens
    //
    // 我们将从检查是否有双引号开始：
    if (char === '"') {
      // 保留一个 `value` 变量来保存我们的字符串标记。
      let value = ''

      // 我们将跳过令牌中的开头双引号。
      char = input[++current]

      // 然后我们将遍历每个字符，直到我们到达另一个双引号。
      while (char !== '"') {
        value += char
        char = input[++current]
      }

      // 跳过结束双引号。
      char = input[++current]

      // 并将我们的 `string` 标记添加到 `tokens` 数组中。
      tokens.push({ type: 'string', value })

      continue
    }

    // 最后一种类型的令牌将是 `name` 令牌。
    // 这是一个字母序列，而不是数字，数字是我们的 lisp 语法中函数的名称。
    //
    //   (add 2 4)
    //    ^^^
    //    Name token
    //
    let LETTERS = /[a-z]/i
    if (LETTERS.test(char)) {
      let value = ''

      // 我们将循环遍历所有的字母，将它们推到一个值。
      while (LETTERS.test(char)) {
        value += char
        char = input[++current]
      }

      // 并将该值作为类型为 `name` 的令牌推送并继续。
      tokens.push({ type: 'name', value })

      continue
    }

    // 最后，如果我们现在还没有匹配到一个字符，我们将抛出一个错误并完全退出。
    throw new TypeError('我不知道这个字符是什么: ' + char)
  }

  // 然后在我们的 `tokenizer` 结束时，我们简单地返回 tokens 数组。
  return tokens
}

/**
 * ============================================================================
 *                                 ヽ/❀o ل͜ o\ﾉ
 *                                THE PARSER!!!
 * ============================================================================
 */

/**
 * 对于我们的解析器，我们将获取我们的标记数组并将其转换为 AST。
 *
 *   [{ type: 'paren', value: '(' }, ...]   =>   { type: 'Program', body: [...] }
 */

// 好的，所以我们定义了一个接受我们的 `tokens` 数组的 `parser` 函数。
function parser(tokens) {
  // 我们再次保留一个将用作游标的 `current` 变量。
  let current = 0

  // 但是这次我们要使用递归而不是 while 循环。所以我们定义了一个 `walk` 函数。
  function walk() {
    // 在 walk 函数中，我们首先获取`current`标记。
    let token = tokens[current]

    // 我们将把每种类型的令牌分成不同的代码路径，从 `number` 令牌开始。
    //
    // 我们测试看看我们是否有一个 `number` 标记。
    if (token.type === 'number') {
      // 如果我们有一个，我们将增加 `current`。
      current++

      // 我们将返回一个名为 `NumberLiteral` 的新 AST 节点，并将其值设置为我们的令牌值。
      return {
        type: 'NumberLiteral',
        value: token.value
      }
    }

    // 如果我们有一个字符串，我们将执行与数字相同的操作并创建一个 `StringLiteral` 节点。
    if (token.type === 'string') {
      current++

      return {
        type: 'StringLiteral',
        value: token.value
      }
    }

    // 接下来我们要查找 `CallExpressions`。当我们遇到一个左括号时，我们就开始了。
    if (token.type === 'paren' && token.value === '(') {
      // 我们将递增 `current` 以跳过括号，因为我们在 AST 中不关心它。
      token = tokens[++current]

      // 我们创建了一个类型为 `CallExpression` 的基节点，并将名称设置为当前令牌的值，
      // 因为左括号后的下一个令牌是函数的名称。
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: []
      }

      // 我们再次递增 `current` 以跳过名称标记。
      token = tokens[++current]

      // 现在，我们想循环遍历每个将成为 `CallExpression` 的 `params` 的令牌，
      // 直到遇到一个右括号。
      //
      // 现在这就是递归的作用所在。
      // 我们将依靠递归来解决问题，而不是试图解析一组可能无限嵌套的节点。
      //
      // 为了解释这一点，我们来看看我们的 Lisp 代码。
      // 您可以看到，`add` 的参数是一个数字和一个嵌套的 `CallExpression`，它包括自己的数字。
      //
      //   (add 2 (subtract 4 2))
      //
      // 您还会注意到，在我们的令牌数组中，我们有多个右括号。
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //   ]
      //
      // 我们将依靠嵌套的 `walk` 函数来增加我们的 `current` 变量，
      // 使其超过任何嵌套的 `CallExpression`。
      //
      // 因此，我们创建了一个 `while` 循环，该循环将继续，
      // 直到它遇到一个 `type` 为 `pare` 和 `value` 为右括号的令牌。
      while (token.type !== 'paren' || (token.type === 'paren' && token.value !== ')')) {
        // 我们将调用 `walk` 函数，该函数将返回一个 `node`，
        // 并将其推送到我们的 `node.params` 中。
        node.params.push(walk())
        token = tokens[current]
      }

      // 最后，我们将最后一次递增 `current` 以跳过右括号。
      current++

      // 并返回节点。
      return node
    }

    // 同样，如果我们现在还没有识别出令牌类型，我们将抛出一个错误。
    throw new TypeError(token.type)
  }

  // 现在，我们将创建我们的 AST，它将有一个根，它是一个`Program`节点。
  let ast = {
    type: 'Program',
    body: []
  }

  // 我们将启动我们的 `walk` 函数，将节点推送到我们的 `ast.body` 数组。
  //
  // 我们在循环内执行此操作的原因是，
  // 因为我们的程序可以一个接一个地使用 `CallExpression` 而不是嵌套。
  //
  //   (add 2 2)
  //   (subtract 4 2)
  //
  while (current < tokens.length) {
    ast.body.push(walk())
  }

  // 在我们的解析器结束时，我们将返回 AST。
  return ast
}

/**
 * ============================================================================
 *                                 ⌒(❀>◞౪◟<❀)⌒
 *                               THE TRAVERSER!!!
 * ============================================================================
 */

/**
 * 所以现在我们有了我们的 AST，我们希望能够用访问者一起访问不同的节点。
 * 每当我们遇到具有匹配类型的节点时，我们需要能够在访问者上调用方法。
 *
 *   traverse(ast, {
 *     Program: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     CallExpression: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *
 *     NumberLiteral: {
 *       enter(node, parent) {
 *         // ...
 *       },
 *       exit(node, parent) {
 *         // ...
 *       },
 *     },
 *   });
 */

// 所以我们定义了一个遍历器函数，它接受一个 AST 和一个访问者。
// 在这里，我们将定义两个函数...
function traverser(ast, visitor) {
  // 一个 `traverseArray` 函数，它允许我们迭代一个数组并调用我们将定义的下一个函数：`traverseNode`。
  function traverseArray(array, parent) {
    array.forEach((child) => {
      traverseNode(child, parent)
    })
  }

  // `traverseNode` 将接受一个 `node` 及其 `parent` 节点。
  // 这样它就可以将两者都传递给我们的访问者方法。
  function traverseNode(node, parent) {
    // 我们首先测试访问者上是否存在具有匹配 `type` 的方法。
    let methods = visitor[node.type]

    // 如果此节点类型有一个 `enter` 方法，我们将使用 `node` 及其 `parent` 调用它。
    if (methods && methods.enter) {
      methods.enter(node, parent)
    }

    // 接下来我们将按当前节点类型进行拆分。
    switch (node.type) {
      // 我们将从我们的顶级 `Program` 开始。
      // 由于程序节点有一个名为 body 的属性，该属性有一个节点数组，因此我们将调用 `traverseArray` 向下遍历它们。
      //
      //（请记住，`traverseArray` 将依次调用 `traverseNode`，因此我们将递归遍历树）
      case 'Program':
        traverseArray(node.body, node)
        break

      // 接下来我们对 `CallExpression` 做同样的事情并遍历它们的 `params`。
      case 'CallExpression':
        traverseArray(node.params, node)
        break

      // 在 `NumberLiteral` 和 `StringLiteral` 的情况下，
      // 我们没有任何子节点可以访问，所以我们就中断。
      case 'NumberLiteral':
      case 'StringLiteral':
        break

      // 同样，如果我们没有识别节点类型，那么我们将抛出一个错误。
      default:
        throw new TypeError(node.type)
    }

    // 如果此节点类型有 `exit` 方法，我们将使用 `node` 及其 `parent` 调用它。
    if (methods && methods.exit) {
      methods.exit(node, parent)
    }
  }

  // 最后，我们通过使用没有 `parent` 的 ast 调用 `traverseNode` 来启动遍历器，因为 AST 的顶层没有父级。
  traverseNode(ast, null)
}

/**
 * ============================================================================
 *                                   ⁽(◍˃̵͈̑ᴗ˂̵͈̑)⁽
 *                              THE TRANSFORMER!!!
 * ============================================================================
 */

/**
 * 接下来是 transformer。我们的 transformer 将获取我们构建的 AST，
 * 并将其传递给带有访问者的 traverser 函数，然后创建一个新的AST。
 *
 * ----------------------------------------------------------------------------
 *   Original AST                     |   Transformed AST
 * ----------------------------------------------------------------------------
 *   {                                |   {
 *     type: 'Program',               |     type: 'Program',
 *     body: [{                       |     body: [{
 *       type: 'CallExpression',      |       type: 'ExpressionStatement',
 *       name: 'add',                 |       expression: {
 *       params: [{                   |         type: 'CallExpression',
 *         type: 'NumberLiteral',     |         callee: {
 *         value: '2'                 |           type: 'Identifier',
 *       }, {                         |           name: 'add'
 *         type: 'CallExpression',    |         },
 *         name: 'subtract',          |         arguments: [{
 *         params: [{                 |           type: 'NumberLiteral',
 *           type: 'NumberLiteral',   |           value: '2'
 *           value: '4'               |         }, {
 *         }, {                       |           type: 'CallExpression',
 *           type: 'NumberLiteral',   |           callee: {
 *           value: '2'               |             type: 'Identifier',
 *         }]                         |             name: 'subtract'
 *       }]                           |           },
 *     }]                             |           arguments: [{
 *   }                                |             type: 'NumberLiteral',
 *                                    |             value: '4'
 * ---------------------------------- |           }, {
 *                                    |             type: 'NumberLiteral',
 *                                    |             value: '2'
 *                                    |           }]
 *  (sorry the other one is longer.)  |         }
 *                                    |       }
 *                                    |     }]
 *                                    |   }
 * ----------------------------------------------------------------------------
 */

// 所以我们有了我们的转换器函数，它将接受 lisp ast。
function transformer(ast) {
  // 我们将创建一个 `newAst`，它像我们之前的 AST 一样将有一个程序节点。
  let newAst = {
    type: 'Program',
    body: []
  }

  // 接下来我要作弊并创建一些 hack。
  // 我们将在我们的父节点上使用一个名为 `context` 的属性，我们将把节点推送到它们父节点的 `context`。
  // 通常你会有比这更好的抽象，但为了我们的目的，这使事情变得简单。
  //
  // 请注意，上下文是从旧 ast 到新 ast 的引用。
  ast._context = newAst.body

  // 我们将从使用我们的 ast 和访问者调用遍历器函数开始。
  traverser(ast, {
    // 第一个访问者方法接受任何 `NumberLiteral`
    NumberLiteral: {
      // 我们将在进入时访问它们。
      enter(node, parent) {
        // 我们将创建一个也名为 `NumberLiteral` 的新节点，并将其推送到父上下文。
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value
        })
      }
    },

    // 接下来我们有 `StringLiteral`
    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value
        })
      }
    },

    // 接下来，`CallExpression`。
    CallExpression: {
      enter(node, parent) {
        // 我们开始使用嵌套的 `Identifier` 创建一个新节点 `CallExpression`
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name
          },
          arguments: []
        }

        // 接下来，我们将在原始的 `CallExpression` 节点上定义一个新的上下文，该节点将引用 `expression` 的参数，以便我们可以推送参数。
        node._context = expression.arguments

        // 然后我们将检查父节点是否为 `CallExpression`。
        // 如果不是...
        if (parent.type !== 'CallExpression') {
          // 我们将用 `ExpressionStatement` 包装我们的 `CallExpression` 节点。
          // 我们这样做是因为 JavaScript 中的顶级 `CallExpression` 实际上是语句。
          expression = {
            type: 'ExpressionStatement',
            expression: expression
          }
        }

        // 最后，我们将我们的（可能包装的）`CallExpression` 推送到 `parent` 的 `context`。
        parent._context.push(expression)
      }
    }
  })

  // 在我们的转换器函数结束时，我们将返回我们刚刚创建的新 ast。
  return newAst
}

/**
 * ============================================================================
 *                               ヾ（〃＾∇＾）ﾉ♪
 *                            THE CODE GENERATOR!!!!
 * ============================================================================
 */

/**
 * 现在让我们进入最后一个阶段：代码生成器。
 *
 * 我们的代码生成器将递归调用自身来打印每个节点，
 * 使 tree 变成一串字符串。
 */

function codeGenerator(node) {
  // 我们将根据 `node` 的 `type` 来分解。
  switch (node.type) {
    // 如果我们有一个 `Program` 节点。
    // 我们将映射 `body` 中的每个节点并通过代码生成器运行它们，并用换行符连接它们。
    case 'Program':
      return node.body.map(codeGenerator).join('\n')

    // 对于 `ExpressionStatement`，我们将在嵌套表达式上调用代码生成器并添加一个分号...
    case 'ExpressionStatement':
      // << (...because we like to code the *correct* way)
      return codeGenerator(node.expression) + ';'

    // 对于 `CallExpression`，我们将打印 `callee`，添加一个左括号，
    // 我们将映射 `arguments` 数组中的每个节点并通过代码生成器运行它们，
    // 用逗号连接它们，然后我们将添加一个右括号。
    case 'CallExpression':
      return codeGenerator(node.callee) + '(' + node.arguments.map(codeGenerator).join(', ') + ')'

    // 对于 `Identifier`，我们只返回 `node` 的名称。
    case 'Identifier':
      return node.name

    // 对于 `NumberLiteral`，我们将只返回 `node` 的值。
    case 'NumberLiteral':
      return node.value

    // 对于 `StringLiteral`，我们将在 `node` 的值周围添加引号。
    case 'StringLiteral':
      return '"' + node.value + '"'

    // 如果我们没有识别出节点，我们会抛出一个错误。
    default:
      throw new TypeError(node.type)
  }
}

/**
 * ============================================================================
 *                                  (۶* ‘ヮ’)۶`
 *                         !!!!!!!!THE COMPILER!!!!!!!!
 * ============================================================================
 */

/**
 * 最后！我们将创建我们的 `compiler` 功能。在这里，我们将把管道的每个部分连接在一起。
 *
 *   1. input  => tokenizer   => tokens
 *   2. tokens => parser      => ast
 *   3. ast    => transformer => newAst
 *   4. newAst => generator   => output
 */

function compiler(input) {
  let tokens = tokenizer(input)
  let ast = parser(tokens)
  let newAst = transformer(ast)
  let output = codeGenerator(newAst)

  // 并简单地返回输出！
  return output
}

/**
 * ============================================================================
 *                                   (๑˃̵ᴗ˂̵)و
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!YOU MADE IT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * ============================================================================
 */

// Now I'm just exporting everything...
module.exports = {
  tokenizer,
  parser,
  traverser,
  transformer,
  codeGenerator,
  compiler
}
