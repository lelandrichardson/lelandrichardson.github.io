(window.webpackJsonp = window.webpackJsonp || []).push([
  [5],
  {
    157: function(e, n, t) {
      "use strict";
      t.r(n);
      var a = t(7),
        r = t.n(a),
        i = t(159),
        o = t.n(i),
        l = t(0),
        s = t.n(l),
        m = t(158),
        u = t(163),
        c = t(162),
        d = t(172),
        p = t(1),
        g = t.n(p),
        f = t(161),
        h = t(160);
      function E() {
        var e = o()(["\n    margin: 0.5rem 0;\n    padding: 0.4rem 0;\n  "]);
        return (
          (E = function() {
            return e;
          }),
          e
        );
      }
      var w = m.c.div.withConfig({
          displayName: "post__Container",
          componentId: "sc-1hygbof-0"
        })(
          ["padding:1rem 0;margin:1rem 0;&:first-child{margin-top:0;}", ""],
          h.a.phone(E())
        ),
        y = m.c.h4.withConfig({
          displayName: "post__Title",
          componentId: "sc-1hygbof-1"
        })(["margin-bottom:0.2rem;font-size:2.2rem;"]),
        v = function(e) {
          var n = e.node;
          return s.a.createElement(
            f.a,
            { to: n.fields.slug },
            s.a.createElement(
              w,
              null,
              s.a.createElement(y, null, n.frontmatter.title),
              s.a.createElement(
                "sub",
                null,
                s.a.createElement("span", null, "on ", n.frontmatter.date),
                s.a.createElement("span", null, "  -  "),
                s.a.createElement("span", null, n.fields.readingTime.text)
              ),
              s.a.createElement("p", {
                dangerouslySetInnerHTML: { __html: n.excerpt }
              })
            )
          );
        };
      v.propTypes = {
        node: g.a.shape({
          id: g.a.string.isRequired,
          frontmatter: g.a.shape({
            title: g.a.string.isRequired,
            date: g.a.string.isRequired
          }),
          fields: g.a.shape({ slug: g.a.string.isRequired }),
          excerpt: g.a.string.isRequired
        })
      };
      var b = v;
      function _() {
        var e = o()(["\n    margin: 3rem 0 0;\n  "]);
        return (
          (_ = function() {
            return e;
          }),
          e
        );
      }
      t.d(n, "pageQuery", function() {
        return q;
      });
      var k = m.c.h3.withConfig({
          displayName: "pages__Title",
          componentId: "dw2xvj-0"
        })(
          ["font-weight:800;font-size:2.6rem;margin:6rem 0 0;", ""],
          h.a.phone(_())
        ),
        R = (function(e) {
          function n() {
            return e.apply(this, arguments) || this;
          }
          return (
            r()(n, e),
            (n.prototype.render = function() {
              var e = this.props.data.allMarkdownRemark.edges;
              return s.a.createElement(
                u.a,
                null,
                s.a.createElement(c.a, {
                  title: "All Posts",
                  keywords: ["gatsby", "blog", "react"]
                }),
                s.a.createElement(d.a, null),
                s.a.createElement(
                  "main",
                  null,
                  s.a.createElement(k, null, "Latest Posts"),
                  e.map(function(e) {
                    var n = e.node;
                    return s.a.createElement(b, { key: n.id, node: n });
                  })
                )
              );
            }),
            n
          );
        })(l.Component),
        q = ((n.default = R), "587173004");
    }
  }
]);
//# sourceMappingURL=component---src-pages-index-js-bc6a9f83fd022b22768a.js.map
