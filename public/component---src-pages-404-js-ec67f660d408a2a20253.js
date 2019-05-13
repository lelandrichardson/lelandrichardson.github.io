(window.webpackJsonp = window.webpackJsonp || []).push([
  [4],
  {
    154: function(t, e, n) {
      "use strict";
      n.r(e);
      var a = n(159),
        i = n.n(a),
        r = n(158),
        o = n(0),
        M = n.n(o),
        l = n(163),
        c = n(162);
      function u() {
        var t = i()([
          "\n          font-size: 10rem;\n          margin: 20vmin 0;\n          display: block;\n        "
        ]);
        return (
          (u = function() {
            return t;
          }),
          t
        );
      }
      var N = r.c.div.withConfig({
        displayName: "sc-404__Container",
        componentId: "y5exdq-0"
      })(["text-align:center;"]);
      e.default = function() {
        return M.a.createElement(
          l.a,
          null,
          M.a.createElement(c.a, { title: "404: Not found" }),
          M.a.createElement(
            N,
            null,
            M.a.createElement(
              g,
              { role: "img", "aria-label": "facepalm emoji" },
              "🤦🏻‍♂️"
            ),
            M.a.createElement("h1", null, "NOT FOUND"),
            M.a.createElement("p", null, "I have not added this page yet.")
          )
        );
      };
      var g = Object(r.c)("span")(u());
    },
    160: function(t, e, n) {
      "use strict";
      n(76), n(56), n(168);
      var a = n(158),
        i = { desktop: 992, tablet: 768, phone: 576 },
        r = Object.keys(i).reduce(function(t, e) {
          return (
            (t[e] = function() {
              return Object(a.b)(
                ["@media (max-width:", "em){", "}"],
                i[e] / 16,
                a.b.apply(void 0, arguments)
              );
            }),
            t
          );
        }, {});
      e.a = r;
    },
    161: function(t, e, n) {
      "use strict";
      var a = n(158),
        i = n(36),
        r = Object(a.c)(i.Link).withConfig({
          displayName: "styled-link__StyledLink",
          componentId: "mjb46b-0"
        })(["text-decoration:none;color:rgba(0,0,0,0.8);"]);
      e.a = r;
    },
    162: function(t, e, n) {
      "use strict";
      var a = n(167),
        i = n(0),
        r = n.n(i),
        o = n(1),
        M = n.n(o),
        l = n(169),
        c = n.n(l),
        u = n(36);
      function N(t) {
        var e = t.description,
          n = t.lang,
          i = t.meta,
          o = t.keywords,
          M = t.title;
        return r.a.createElement(u.StaticQuery, {
          query: g,
          render: function(t) {
            var a = e || t.site.siteMetadata.description;
            return r.a.createElement(c.a, {
              htmlAttributes: { lang: n },
              title: M,
              titleTemplate: "%s | " + t.site.siteMetadata.title,
              meta: [
                { name: "description", content: a },
                { property: "og:title", content: M },
                { property: "og:description", content: a },
                { property: "og:type", content: "website" },
                { name: "twitter:card", content: "summary" },
                {
                  name: "twitter:creator",
                  content: t.site.siteMetadata.author
                },
                { name: "twitter:title", content: M },
                { name: "twitter:description", content: a }
              ]
                .concat(
                  o.length > 0
                    ? { name: "keywords", content: o.join(", ") }
                    : []
                )
                .concat(i)
            });
          },
          data: a
        });
      }
      (N.defaultProps = { lang: "en", meta: [], keywords: [] }),
        (N.propTypes = {
          description: M.a.string,
          lang: M.a.string,
          meta: M.a.array,
          keywords: M.a.arrayOf(M.a.string),
          title: M.a.string.isRequired
        }),
        (e.a = N);
      var g = "1025518380";
    },
    163: function(t, e, n) {
      "use strict";
      var a = n(7),
        i = n.n(a),
        r = n(159),
        o = n.n(r),
        M = n(164),
        l = n(0),
        c = n.n(l),
        u = n(1),
        N = n.n(u),
        g = n(158),
        s = n(36),
        L = n(161),
        j = n(160),
        d = n(165),
        y = n.n(d),
        m = n(166),
        D = n.n(m);
      function p() {
        var t = o()(["\n    text-align: center;\n  "]);
        return (
          (p = function() {
            return t;
          }),
          t
        );
      }
      var z = g.c.nav.withConfig({
          displayName: "header__Container",
          componentId: "di30r3-0"
        })([
          "box-shadow:0 4px 12px 0 rgba(0,0,0,0.05);height:6rem;display:flex;align-items:center;"
        ]),
        w = g.c.h1.withConfig({
          displayName: "header__Title",
          componentId: "di30r3-1"
        })(
          [
            "font-size:1.6rem;font-weight:800;letter-spacing:0.1rem;text-transform:uppercase;margin:0 auto 0 24px;",
            ""
          ],
          j.a.phone(p())
        ),
        I = g.c.img.withConfig({
          displayName: "header__Icon",
          componentId: "di30r3-2"
        })([
          "height:2.5rem;width:2.5rem;padding:1.5rem 1rem;margin-right:24px;"
        ]),
        T = function(t) {
          var e = t.title;
          return c.a.createElement(
            z,
            null,
            c.a.createElement(L.a, { to: "/" }, c.a.createElement(w, null, e)),
            c.a.createElement(
              "a",
              {
                style: { marginLeft: "auto" },
                href: "https://twitter.com/intelligibabble",
                target: "_blank",
                rel: "noopener noreferrer"
              },
              c.a.createElement(I, { src: y.a, alt: "twitter" })
            ),
            c.a.createElement(
              "a",
              {
                href: "https://github.com/lelandrichardson",
                target: "_blank",
                rel: "noopener noreferrer"
              },
              c.a.createElement(I, { src: D.a, alt: "github" })
            )
          );
        };
      (T.defaultProps = { title: "" }), (T.propTypes = { title: N.a.string });
      var x = T;
      function b() {
        var t = o()(["\n    width: 80%;\n  "]);
        return (
          (b = function() {
            return t;
          }),
          t
        );
      }
      function h() {
        var t = o()([
          '\n  @font-face {\n    font-family: system;\n    font-style: normal;\n    font-weight: 300;\n    src: local(\'.SFNSText-Light\'), local(\'.HelveticaNeueDeskInterface-Light\'),\n      local(\'.LucidaGrandeUI\'), local(\'Ubuntu Light\'), local(\'Segoe UI Light\'),\n      local(\'Roboto-Light\'), local(\'DroidSans\'), local(\'Tahoma\');\n  }\n\n  :root {\n    font-size: 10px;\n  }\n\n  body {\n    font-family: Verdana;\n    margin: 0;\n    text-rendering: optimizeLegibility;\n    -webkit-font-smoothing: antialiased;\n    color: rgba(0, 0, 0, 0.8);\n    min-height: 100vh;\n    position: relative;\n    font-size: 1.9rem;\n  }\n\n  h1, h2, h3, h4, h5, h6 {\n    font-family: \'Oswald\', sans-serif;\n  }\n\n  h2 {\n    font-size: 2.5rem;\n  }\n\n  h3 {\n    font-size: 2.4rem;\n  }\n\n  h4 {\n    font-size: 1.9rem;\n  }\n  \n  code {\n    font-family: Menlo,Monaco,"Courier New",Courier,monospace;\n    word-break: break-word;\n  }\n\n  code[class*="language-"], pre[class*="language-"] {\n    line-height: 1.3;\n  }\n\n  pre code {\n    word-break: normal;\n    font-size: 1.4rem;\n  }\n\n  :not(pre) > code[class*="language-"] {\n    background-color: #eaeaea;\n    padding: .1em 0.5em;\n    border-radius: .2em;\n    color: #8a4519;\n    font-size: smaller;\n    line-height: 1.6;\n  }\n\n\n  .table {\n    width: 100%;\n    border: 1px solid #222;\n    border-spacing: 0;\n    border-collapse: collapse;\n    font-size: 1.4rem;\n  }\n\n  .table td, .table th {\n    padding: 4px;\n    vertical-align: top;\n    border-top: 1px solid #222;\n    border: 1px solid #222;\n  }\n\n  .table thead th {\n    vertical-align: bottom;\n    border-bottom: 2px solid #222;\n  }\n\n\n  .remark-code-title {\n    margin-bottom: -8px;\n    padding: 0.5em 1em;\n    font-family: Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;\n\n    background-color: #464646;\n    color: white;\n    z-index: 0;\n\n    border-top-left-radius: 0.3em;\n    border-top-right-radius: 0.3em;\n  }\n\n  twitter-widget {\n    margin: 10px auto;\n  }\n'
        ]);
        return (
          (h = function() {
            return t;
          }),
          t
        );
      }
      var A = Object(g.a)(h()),
        C = g.c.footer.withConfig({
          displayName: "layout__Footer",
          componentId: "sc-14pgzi3-0"
        })(["display:block;height:6rem;"]),
        E = g.c.div.withConfig({
          displayName: "layout__Content",
          componentId: "sc-14pgzi3-1"
        })(["width:60%;max-width:728px;margin:0 auto;", ""], j.a.tablet(b())),
        f = (function(t) {
          function e() {
            return t.apply(this, arguments) || this;
          }
          return (
            i()(e, t),
            (e.prototype.render = function() {
              var t = this.props.children;
              return c.a.createElement(s.StaticQuery, {
                query: "1044757290",
                render: function(e) {
                  return c.a.createElement(
                    c.a.Fragment,
                    null,
                    c.a.createElement(x, { title: e.site.siteMetadata.title }),
                    c.a.createElement(E, null, t),
                    c.a.createElement(C, null),
                    c.a.createElement(A, null)
                  );
                },
                data: M
              });
            }),
            e
          );
        })(l.Component);
      f.propTypes = { children: N.a.node.isRequired };
      e.a = f;
    },
    164: function(t) {
      t.exports = {
        data: { site: { siteMetadata: { title: "Intelligible Babble" } } }
      };
    },
    165: function(t, e) {
      t.exports =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE4LjEuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNjEyIDYxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjEyIDYxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPGc+DQoJCTxwYXRoIHN0eWxlPSJmaWxsOiMwMTAwMDI7IiBkPSJNNjEyLDExNi4yNThjLTIyLjUyNSw5Ljk4MS00Ni42OTQsMTYuNzUtNzIuMDg4LDE5Ljc3MmMyNS45MjktMTUuNTI3LDQ1Ljc3Ny00MC4xNTUsNTUuMTg0LTY5LjQxMQ0KCQkJYy0yNC4zMjIsMTQuMzc5LTUxLjE2OSwyNC44Mi03OS43NzUsMzAuNDhjLTIyLjkwNy0yNC40MzctNTUuNDktMzkuNjU4LTkxLjYzLTM5LjY1OGMtNjkuMzM0LDAtMTI1LjU1MSw1Ni4yMTctMTI1LjU1MSwxMjUuNTEzDQoJCQljMCw5LjgyOCwxLjEwOSwxOS40MjcsMy4yNTEsMjguNjA2QzE5Ny4wNjUsMjA2LjMyLDEwNC41NTYsMTU2LjMzNyw0Mi42NDEsODAuMzg2Yy0xMC44MjMsMTguNTEtMTYuOTgsNDAuMDc4LTE2Ljk4LDYzLjEwMQ0KCQkJYzAsNDMuNTU5LDIyLjE4MSw4MS45OTMsNTUuODM1LDEwNC40NzljLTIwLjU3NS0wLjY4OC0zOS45MjYtNi4zNDgtNTYuODY3LTE1Ljc1NnYxLjU2OGMwLDYwLjgwNiw0My4yOTEsMTExLjU1NCwxMDAuNjkzLDEyMy4xMDQNCgkJCWMtMTAuNTE3LDIuODMtMjEuNjA3LDQuMzk4LTMzLjA4LDQuMzk4Yy04LjEwNywwLTE1Ljk0Ny0wLjgwMy0yMy42MzQtMi4zMzNjMTUuOTg1LDQ5LjkwNyw2Mi4zMzYsODYuMTk5LDExNy4yNTMsODcuMTk0DQoJCQljLTQyLjk0NywzMy42NTQtOTcuMDk5LDUzLjY1NS0xNTUuOTE2LDUzLjY1NWMtMTAuMTM0LDAtMjAuMTE2LTAuNjEyLTI5Ljk0NC0xLjcyMWM1NS41NjcsMzUuNjgxLDEyMS41MzYsNTYuNDg1LDE5Mi40MzgsNTYuNDg1DQoJCQljMjMwLjk0OCwwLDM1Ny4xODgtMTkxLjI5MSwzNTcuMTg4LTM1Ny4xODhsLTAuNDIxLTE2LjI1M0M1NzMuODcyLDE2My41MjYsNTk1LjIxMSwxNDEuNDIyLDYxMiwxMTYuMjU4eiIvPg0KCTwvZz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K";
    },
    166: function(t, e) {
      t.exports =
        "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+R2l0SHViIGljb248L3RpdGxlPjxwYXRoIGQ9Ik0xMiAuMjk3Yy02LjYzIDAtMTIgNS4zNzMtMTIgMTIgMCA1LjMwMyAzLjQzOCA5LjggOC4yMDUgMTEuMzg1LjYuMTEzLjgyLS4yNTguODItLjU3NyAwLS4yODUtLjAxLTEuMDQtLjAxNS0yLjA0LTMuMzM4LjcyNC00LjA0Mi0xLjYxLTQuMDQyLTEuNjFDNC40MjIgMTguMDcgMy42MzMgMTcuNyAzLjYzMyAxNy43Yy0xLjA4Ny0uNzQ0LjA4NC0uNzI5LjA4NC0uNzI5IDEuMjA1LjA4NCAxLjgzOCAxLjIzNiAxLjgzOCAxLjIzNiAxLjA3IDEuODM1IDIuODA5IDEuMzA1IDMuNDk1Ljk5OC4xMDgtLjc3Ni40MTctMS4zMDUuNzYtMS42MDUtMi42NjUtLjMtNS40NjYtMS4zMzItNS40NjYtNS45MyAwLTEuMzEuNDY1LTIuMzggMS4yMzUtMy4yMi0uMTM1LS4zMDMtLjU0LTEuNTIzLjEwNS0zLjE3NiAwIDAgMS4wMDUtLjMyMiAzLjMgMS4yMy45Ni0uMjY3IDEuOTgtLjM5OSAzLS40MDUgMS4wMi4wMDYgMi4wNC4xMzggMyAuNDA1IDIuMjgtMS41NTIgMy4yODUtMS4yMyAzLjI4NS0xLjIzLjY0NSAxLjY1My4yNCAyLjg3My4xMiAzLjE3Ni43NjUuODQgMS4yMyAxLjkxIDEuMjMgMy4yMiAwIDQuNjEtMi44MDUgNS42MjUtNS40NzUgNS45Mi40Mi4zNi44MSAxLjA5Ni44MSAyLjIyIDAgMS42MDYtLjAxNSAyLjg5Ni0uMDE1IDMuMjg2IDAgLjMxNS4yMS42OS44MjUuNTdDMjAuNTY1IDIyLjA5MiAyNCAxNy41OTIgMjQgMTIuMjk3YzAtNi42MjctNS4zNzMtMTItMTItMTIiLz48L3N2Zz4=";
    },
    167: function(t) {
      t.exports = {
        data: {
          site: {
            siteMetadata: {
              title: "Intelligible Babble",
              description: "Personal blog of Leland Richardson.",
              author: "Leland Richardson"
            }
          }
        }
      };
    }
  }
]);
//# sourceMappingURL=component---src-pages-404-js-ec67f660d408a2a20253.js.map
