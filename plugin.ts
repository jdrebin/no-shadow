export default {
  name: "no-shadow",
  rules: {
    "no-shadow": {
      create(ctx) {
        type Result = Deno.lint.Identifier | undefined | Result[];

        function next(node: Deno.lint.Node | null): Result {
          if (!node) {
            return;
          }
          switch (node.type) {
            case "ObjectPattern":
              return down.ObjectPattern(node);
            case "ArrayPattern":
              return down.ArrayPattern(node);
            case "AssignmentPattern":
              return down.AssignmentPattern(node);
            case "RestElement":
              return down.RestElement(node);
            case "Identifier":
              return down.Identifier(node);
            case "Property":
              return down.Property(node);
            case "VariableDeclaration":
              return node.declarations.map((declaration) =>
                next(declaration.id)
              );
            default:
              return;
          }
        }

        const down = {
          Identifier(node) {
            return node;
          },
          ObjectPattern(node) {
            return node.properties.map((property) => next(property));
          },
          ArrayPattern(node) {
            return node.elements.map((element) => next(element));
          },
          AssignmentPattern(node) {
            return next(node.left);
          },
          RestElement(node) {
            return next(node.argument);
          },
          Property(node) {
            if (!node.value?.type) {
              if (node.key.type === "Identifier") {
                return down.Identifier(node.key);
              }
            } else {
              return next(node.value);
            }
          },
        } satisfies Deno.lint.LintVisitor;

        type HasParams = Deno.lint.Node & { params: Deno.lint.Parameter[] };
        const up = {
          Block(
            node:
              | Deno.lint.BlockStatement
              | Deno.lint.StaticBlock
              | Deno.lint.Program,
          ) {
            return node.body.map((stmnt) => {
              switch (stmnt.type) {
                case "VariableDeclaration":
                  return next(stmnt);
                case "FunctionDeclaration":
                  return next(stmnt.id);
                case "ClassDeclaration":
                  return next(stmnt.id);
              }
            });
          },
          For(
            node:
              | Deno.lint.ForStatement
              | Deno.lint.ForInStatement
              | Deno.lint.ForOfStatement,
          ) {
            const nextNode = node.type === "ForStatement"
              ? node.init
              : node.left;
            if (nextNode?.type === "VariableDeclaration") {
              return next(nextNode);
            }
          },
          CatchClause(node: Deno.lint.CatchClause) {
            return next(node.param);
          },
          HasParameters(node: HasParams) {
            return node.params?.filter((param) =>
              param.type !== "TSParameterProperty"
            ).map((param) => next(param));
          },
        };

        function handleId(node: Deno.lint.Identifier) {
          const ancestors = ctx.sourceCode.getAncestors(node);
          let inFirst = true;

          return ancestors.reduceRight((acc, cur) => {
            function add(id: Result) {
              if (Array.isArray(id)) {
                id.forEach((n) => add(n));
              } else {
                //id && acc.add(id.name);
                id && acc.push(id);
              }
            }
            switch (cur.type) {
              case "BlockStatement":
              case "StaticBlock":
              case "Program": {
                if (inFirst) {
                  inFirst = false;
                } else {
                  const res = up.Block(cur);
                  add(res);
                }
                break;
              }
              case "ForStatement":
              case "ForInStatement":
              case "ForOfStatement": {
                inFirst = false;
                add(up.For(cur));
                break;
              }
              case "CatchClause": {
                inFirst = false;
                add(up.CatchClause(cur));
                break;
              }
              default: {
                if ("params" in cur && "body" in cur) {
                  inFirst = false;
                  add(up.HasParameters(cur));
                }
                break;
              }
            }
            return acc;
          }, [] as any[]);
        }

        function flatten(
          result: Result,
          flattened = [] as Deno.lint.Identifier[],
        ) {
          if (Array.isArray(result)) {
            result.forEach((r) => flatten(r, flattened));
          } else if (result) {
            flattened.push(result);
          }
          return flattened;
        }

        function handleIds(ids: Result) {
          const result = flatten(ids);
          return result.map((id) => {
            const handled = handleId(id);
            console.log({ handled, id });
            return handled;
          });
        }

        return {
          // VariableDeclaration(node) {
          //   return handleIds(next(node));
          // },
          // FunctionDeclaration(node) {
          //   return handleIds(next(node.id));
          // },
          // ClassDeclaration(node: Deno.lint.ClassDeclaration) {
          //   return handleIds(next(node.id));
          // },
          // ImportDefaultSpecifier(node) {
          //   return handleIds(next(node.local));
          // },
          // ImportSpecifier(node) {
          //   return handleIds(next(node.local));
          // },
          // ImportNamespaceSpecifier(node) {
          //   return handleIds(next(node.local));
          // },
          // CatchClause(node) {
          //   return handleIds(up.CatchClause(node));
          // },
          // "*[params.length > 0][body.type]"(node) {
          //   return handleIds(up.HasParameters(node));
          // },
          "VariableDeclaration[kind='let']"(node) {
            return handleIds(next(node));
          },
        };
      },
    },
  },
} as Deno.lint.Plugin;

export const a = 21;
