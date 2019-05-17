(window.webpackJsonp = window.webpackJsonp || []).push([
  [4],
  {
    154: function(e, t, n) {
      "use strict";
      n.r(t);
      var i = n(159),
        a = n.n(i),
        r = n(158),
        M = n(0),
        o = n.n(M),
        c = n(163),
        l = n(162);
      function N() {
        var e = a()([
          "\n          font-size: 10rem;\n          margin: 20vmin 0;\n          display: block;\n        "
        ]);
        return (
          (N = function() {
            return e;
          }),
          e
        );
      }
      var u = r.c.div.withConfig({
        displayName: "sc-404__Container",
        componentId: "y5exdq-0"
      })(["text-align:center;"]);
      t.default = function() {
        return o.a.createElement(
          c.a,
          null,
          o.a.createElement(l.a, { title: "404: Not found" }),
          o.a.createElement(
            u,
            null,
            o.a.createElement(
              L,
              { role: "img", "aria-label": "facepalm emoji" },
              "🤦🏻‍♂️"
            ),
            o.a.createElement("h1", null, "NOT FOUND"),
            o.a.createElement("p", null, "I have not added this page yet.")
          )
        );
      };
      var L = Object(r.c)("span")(N());
    },
    160: function(e, t, n) {
      "use strict";
      n(76), n(56), n(169);
      var i = n(158),
        a = { desktop: 992, tablet: 768, phone: 576 },
        r = Object.keys(a).reduce(function(e, t) {
          return (
            (e[t] = function() {
              return Object(i.b)(
                ["@media (max-width:", "em){", "}"],
                a[t] / 16,
                i.b.apply(void 0, arguments)
              );
            }),
            e
          );
        }, {});
      t.a = r;
    },
    161: function(e, t, n) {
      "use strict";
      var i = n(158),
        a = n(36),
        r = Object(i.c)(a.Link).withConfig({
          displayName: "styled-link__StyledLink",
          componentId: "mjb46b-0"
        })(["text-decoration:none;color:rgba(0,0,0,0.8);"]);
      t.a = r;
    },
    162: function(e, t, n) {
      "use strict";
      var i = n(168),
        a = n(0),
        r = n.n(a),
        M = n(1),
        o = n.n(M),
        c = n(170),
        l = n.n(c),
        N = n(36);
      function u(e) {
        var t = e.description,
          n = e.lang,
          a = e.meta,
          M = e.keywords,
          o = e.title;
        return r.a.createElement(N.StaticQuery, {
          query: L,
          render: function(e) {
            var i = t || e.site.siteMetadata.description;
            return r.a.createElement(l.a, {
              htmlAttributes: { lang: n },
              title: o,
              titleTemplate: "%s | " + e.site.siteMetadata.title,
              link: [
                {
                  rel: "alternate",
                  type: "application/rss+xml",
                  href: "/rss.xml"
                }
              ],
              meta: [
                { name: "description", content: i },
                { property: "og:title", content: o },
                { property: "og:description", content: i },
                { property: "og:type", content: "website" },
                { name: "twitter:card", content: "summary" },
                {
                  name: "twitter:creator",
                  content: e.site.siteMetadata.author
                },
                { name: "twitter:title", content: o },
                { name: "twitter:description", content: i }
              ]
                .concat(
                  M.length > 0
                    ? { name: "keywords", content: M.join(", ") }
                    : []
                )
                .concat(a)
            });
          },
          data: i
        });
      }
      (u.defaultProps = { lang: "en", meta: [], keywords: [] }),
        (u.propTypes = {
          description: o.a.string,
          lang: o.a.string,
          meta: o.a.array,
          keywords: o.a.arrayOf(o.a.string),
          title: o.a.string.isRequired
        }),
        (t.a = u);
      var L = "1025518380";
    },
    163: function(e, t, n) {
      "use strict";
      var i = n(7),
        a = n.n(i),
        r = n(159),
        M = n.n(r),
        o = n(164),
        c = n(0),
        l = n.n(c),
        N = n(1),
        u = n.n(N),
        L = n(158),
        s = n(36),
        j = n(161),
        g = n(160),
        y = n(165),
        d = n.n(y),
        D = n(166),
        z = n.n(D),
        m = n(167),
        I = n.n(m);
      function T() {
        var e = M()(["\n    text-align: center;\n  "]);
        return (
          (T = function() {
            return e;
          }),
          e
        );
      }
      var w = L.c.nav.withConfig({
          displayName: "header__Container",
          componentId: "di30r3-0"
        })([
          "box-shadow:0 4px 12px 0 rgba(0,0,0,0.05);height:6rem;display:flex;align-items:center;"
        ]),
        p = L.c.h1.withConfig({
          displayName: "header__Title",
          componentId: "di30r3-1"
        })(
          [
            "font-size:1.6rem;font-weight:800;letter-spacing:0.1rem;text-transform:uppercase;margin:0 auto 0 24px;",
            ""
          ],
          g.a.phone(T())
        ),
        x = L.c.img.withConfig({
          displayName: "header__Icon",
          componentId: "di30r3-2"
        })([
          "height:2.5rem;width:2.5rem;padding:1.5rem 1rem;margin-right:24px;"
        ]),
        A = function(e) {
          var t = e.title;
          return l.a.createElement(
            w,
            null,
            l.a.createElement(j.a, { to: "/" }, l.a.createElement(p, null, t)),
            l.a.createElement(
              "a",
              {
                style: { marginLeft: "auto" },
                href: "https://twitter.com/intelligibabble",
                target: "_blank",
                rel: "noopener noreferrer"
              },
              l.a.createElement(x, { src: d.a, alt: "twitter" })
            ),
            l.a.createElement(
              "a",
              {
                href: "https://github.com/lelandrichardson",
                target: "_blank",
                rel: "noopener noreferrer"
              },
              l.a.createElement(x, { src: z.a, alt: "github" })
            ),
            l.a.createElement(
              "a",
              {
                href: "/rss.xml",
                rel: "alternate",
                type: "application/rss+xml"
              },
              l.a.createElement(x, { src: I.a, alt: "Rss Feed" })
            )
          );
        };
      (A.defaultProps = { title: "" }), (A.propTypes = { title: u.a.string });
      var E = A;
      function b() {
        var e = M()(["\n    width: 80%;\n  "]);
        return (
          (b = function() {
            return e;
          }),
          e
        );
      }
      function h() {
        var e = M()([
          '\n  @font-face {\n    font-family: system;\n    font-style: normal;\n    font-weight: 300;\n    src: local(\'.SFNSText-Light\'), local(\'.HelveticaNeueDeskInterface-Light\'),\n      local(\'.LucidaGrandeUI\'), local(\'Ubuntu Light\'), local(\'Segoe UI Light\'),\n      local(\'Roboto-Light\'), local(\'DroidSans\'), local(\'Tahoma\');\n  }\n\n  :root {\n    font-size: 10px;\n  }\n\n  body {\n    font-family: Verdana;\n    margin: 0;\n    text-rendering: optimizeLegibility;\n    -webkit-font-smoothing: antialiased;\n    color: rgba(0, 0, 0, 0.8);\n    min-height: 100vh;\n    position: relative;\n    font-size: 1.9rem;\n  }\n\n  h1, h2, h3, h4, h5, h6 {\n    font-family: \'Oswald\', sans-serif;\n  }\n\n  h2 {\n    font-size: 2.5rem;\n  }\n\n  h3 {\n    font-size: 2.4rem;\n  }\n\n  h4 {\n    font-size: 1.9rem;\n  }\n  \n  code {\n    font-family: Menlo,Monaco,"Courier New",Courier,monospace;\n    word-break: break-word;\n  }\n\n  code[class*="language-"], pre[class*="language-"] {\n    line-height: 1.3;\n  }\n\n  pre code {\n    word-break: normal;\n    font-size: 1.4rem;\n  }\n\n  :not(pre) > code[class*="language-"] {\n    background-color: #eaeaea;\n    padding: .1em 0.5em;\n    border-radius: .2em;\n    color: #8a4519;\n    font-size: smaller;\n    line-height: 1.6;\n  }\n\n\n  .table {\n    width: 100%;\n    border: 1px solid #222;\n    border-spacing: 0;\n    border-collapse: collapse;\n    font-size: 1.4rem;\n  }\n\n  .table td, .table th {\n    padding: 4px;\n    vertical-align: top;\n    border-top: 1px solid #222;\n    border: 1px solid #222;\n  }\n\n  .table thead th {\n    vertical-align: bottom;\n    border-bottom: 2px solid #222;\n  }\n\n\n  .remark-code-title {\n    margin-bottom: -8px;\n    padding: 0.5em 1em;\n    font-family: Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;\n\n    background-color: #464646;\n    color: white;\n    z-index: 0;\n\n    border-top-left-radius: 0.3em;\n    border-top-right-radius: 0.3em;\n  }\n\n  twitter-widget {\n    margin: 10px auto;\n  }\n'
        ]);
        return (
          (h = function() {
            return e;
          }),
          e
        );
      }
      var S = Object(L.a)(h()),
        C = L.c.footer.withConfig({
          displayName: "layout__Footer",
          componentId: "sc-14pgzi3-0"
        })(["display:block;height:6rem;"]),
        f = L.c.div.withConfig({
          displayName: "layout__Content",
          componentId: "sc-14pgzi3-1"
        })(["width:60%;max-width:728px;margin:0 auto;", ""], g.a.tablet(b())),
        O = (function(e) {
          function t() {
            return e.apply(this, arguments) || this;
          }
          return (
            a()(t, e),
            (t.prototype.render = function() {
              var e = this.props.children;
              return l.a.createElement(s.StaticQuery, {
                query: "1044757290",
                render: function(t) {
                  return l.a.createElement(
                    l.a.Fragment,
                    null,
                    l.a.createElement(E, { title: t.site.siteMetadata.title }),
                    l.a.createElement(f, null, e),
                    l.a.createElement(C, null),
                    l.a.createElement(S, null)
                  );
                },
                data: o
              });
            }),
            t
          );
        })(c.Component);
      O.propTypes = { children: u.a.node.isRequired };
      t.a = O;
    },
    164: function(e) {
      e.exports = {
        data: { site: { siteMetadata: { title: "Intelligible Babble" } } }
      };
    },
    165: function(e, t) {
      e.exports =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE4LjEuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNjEyIDYxMiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjEyIDYxMjsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPGc+DQoJPGc+DQoJCTxwYXRoIHN0eWxlPSJmaWxsOiMwMTAwMDI7IiBkPSJNNjEyLDExNi4yNThjLTIyLjUyNSw5Ljk4MS00Ni42OTQsMTYuNzUtNzIuMDg4LDE5Ljc3MmMyNS45MjktMTUuNTI3LDQ1Ljc3Ny00MC4xNTUsNTUuMTg0LTY5LjQxMQ0KCQkJYy0yNC4zMjIsMTQuMzc5LTUxLjE2OSwyNC44Mi03OS43NzUsMzAuNDhjLTIyLjkwNy0yNC40MzctNTUuNDktMzkuNjU4LTkxLjYzLTM5LjY1OGMtNjkuMzM0LDAtMTI1LjU1MSw1Ni4yMTctMTI1LjU1MSwxMjUuNTEzDQoJCQljMCw5LjgyOCwxLjEwOSwxOS40MjcsMy4yNTEsMjguNjA2QzE5Ny4wNjUsMjA2LjMyLDEwNC41NTYsMTU2LjMzNyw0Mi42NDEsODAuMzg2Yy0xMC44MjMsMTguNTEtMTYuOTgsNDAuMDc4LTE2Ljk4LDYzLjEwMQ0KCQkJYzAsNDMuNTU5LDIyLjE4MSw4MS45OTMsNTUuODM1LDEwNC40NzljLTIwLjU3NS0wLjY4OC0zOS45MjYtNi4zNDgtNTYuODY3LTE1Ljc1NnYxLjU2OGMwLDYwLjgwNiw0My4yOTEsMTExLjU1NCwxMDAuNjkzLDEyMy4xMDQNCgkJCWMtMTAuNTE3LDIuODMtMjEuNjA3LDQuMzk4LTMzLjA4LDQuMzk4Yy04LjEwNywwLTE1Ljk0Ny0wLjgwMy0yMy42MzQtMi4zMzNjMTUuOTg1LDQ5LjkwNyw2Mi4zMzYsODYuMTk5LDExNy4yNTMsODcuMTk0DQoJCQljLTQyLjk0NywzMy42NTQtOTcuMDk5LDUzLjY1NS0xNTUuOTE2LDUzLjY1NWMtMTAuMTM0LDAtMjAuMTE2LTAuNjEyLTI5Ljk0NC0xLjcyMWM1NS41NjcsMzUuNjgxLDEyMS41MzYsNTYuNDg1LDE5Mi40MzgsNTYuNDg1DQoJCQljMjMwLjk0OCwwLDM1Ny4xODgtMTkxLjI5MSwzNTcuMTg4LTM1Ny4xODhsLTAuNDIxLTE2LjI1M0M1NzMuODcyLDE2My41MjYsNTk1LjIxMSwxNDEuNDIyLDYxMiwxMTYuMjU4eiIvPg0KCTwvZz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjwvc3ZnPg0K";
    },
    166: function(e, t) {
      e.exports =
        "data:image/svg+xml;base64,PHN2ZyByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+R2l0SHViIGljb248L3RpdGxlPjxwYXRoIGQ9Ik0xMiAuMjk3Yy02LjYzIDAtMTIgNS4zNzMtMTIgMTIgMCA1LjMwMyAzLjQzOCA5LjggOC4yMDUgMTEuMzg1LjYuMTEzLjgyLS4yNTguODItLjU3NyAwLS4yODUtLjAxLTEuMDQtLjAxNS0yLjA0LTMuMzM4LjcyNC00LjA0Mi0xLjYxLTQuMDQyLTEuNjFDNC40MjIgMTguMDcgMy42MzMgMTcuNyAzLjYzMyAxNy43Yy0xLjA4Ny0uNzQ0LjA4NC0uNzI5LjA4NC0uNzI5IDEuMjA1LjA4NCAxLjgzOCAxLjIzNiAxLjgzOCAxLjIzNiAxLjA3IDEuODM1IDIuODA5IDEuMzA1IDMuNDk1Ljk5OC4xMDgtLjc3Ni40MTctMS4zMDUuNzYtMS42MDUtMi42NjUtLjMtNS40NjYtMS4zMzItNS40NjYtNS45MyAwLTEuMzEuNDY1LTIuMzggMS4yMzUtMy4yMi0uMTM1LS4zMDMtLjU0LTEuNTIzLjEwNS0zLjE3NiAwIDAgMS4wMDUtLjMyMiAzLjMgMS4yMy45Ni0uMjY3IDEuOTgtLjM5OSAzLS40MDUgMS4wMi4wMDYgMi4wNC4xMzggMyAuNDA1IDIuMjgtMS41NTIgMy4yODUtMS4yMyAzLjI4NS0xLjIzLjY0NSAxLjY1My4yNCAyLjg3My4xMiAzLjE3Ni43NjUuODQgMS4yMyAxLjkxIDEuMjMgMy4yMiAwIDQuNjEtMi44MDUgNS42MjUtNS40NzUgNS45Mi40Mi4zNi44MSAxLjA5Ni44MSAyLjIyIDAgMS42MDYtLjAxNSAyLjg5Ni0uMDE1IDMuMjg2IDAgLjMxNS4yMS42OS44MjUuNTdDMjAuNTY1IDIyLjA5MiAyNCAxNy41OTIgMjQgMTIuMjk3YzAtNi42MjctNS4zNzMtMTItMTItMTIiLz48L3N2Zz4=";
    },
    167: function(e, t) {
      e.exports =
        "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDU2LjY5MyA1Ni42OTMiIGhlaWdodD0iNTYuNjkzcHgiIGlkPSJMYXllcl8xIiB2ZXJzaW9uPSIxLjEiIHZpZXdCb3g9IjAgMCA1Ni42OTMgNTYuNjkzIiB3aWR0aD0iNTYuNjkzcHgiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Ik0zLjQyOCwzMS4wODVjNi4xOSwwLDEyLjAwOSwyLjQxOCwxNi4zODIsNi44MTZjNC4zODEsNC4zOTgsNi43OTMsMTAuMjU2LDYuNzkzLDE2LjQ5Mmg5LjUzOSAgYzAtMTguMTEzLTE0LjY3Ni0zMi44NDgtMzIuNzE0LTMyLjg0OFYzMS4wODV6IE0zLjQ0MywxNC4xNzRjMjIuMDYxLDAsNDAuMDEsMTguMDQ3LDQwLjAxLDQwLjIzMWg5LjUzOSAgYzAtMjcuNDQ1LTIyLjIyOS00OS43Ny00OS41NDktNDkuNzdWMTQuMTc0eiBNMTYuNjM0LDQ3Ljc0MWMwLDMuNjQ4LTIuOTU5LDYuNjA3LTYuNjA3LDYuNjA3UzMuNDIsNTEuMzksMy40Miw0Ny43NDEgIGMwLTMuNjUsMi45NTgtNi42MDcsNi42MDYtNi42MDdTMTYuNjM0LDQ0LjA5MSwxNi42MzQsNDcuNzQxeiIvPjwvc3ZnPg==";
    },
    168: function(e) {
      e.exports = {
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
//# sourceMappingURL=component---src-pages-404-js-93d881da845364e6847e.js.map
