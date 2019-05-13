(window.webpackJsonp = window.webpackJsonp || []).push([
  [5],
  {
    157: function(e, n, t) {
      "use strict";
      t.r(n);
      var a = t(7),
        r = t.n(a),
        i = t(159),
        l = t.n(i),
        o = t(0),
        s = t.n(o),
        m = t(158),
        u = t(163),
        p = t(162),
        c = t(171),
        d = t(1),
        f = t.n(d),
        g = t(161),
        h = t(160);
      function E() {
        var e = l()(["\n    margin: 0.5rem 0;\n    padding: 0.4rem 0;\n  "]);
        return (
          (E = function() {
            return e;
          }),
          e
        );
      }
      var v = m.c.div.withConfig({
          displayName: "post__Container",
          componentId: "airrv5-0"
        })(
          ["padding:1rem 0;margin:1rem 0;&:first-child{margin-top:0;}", ""],
          h.a.phone(E())
        ),
        w = m.c.h4.withConfig({
          displayName: "post__Title",
          componentId: "airrv5-1"
        })(["margin-bottom:0.2rem;font-size:2.2rem;"]),
        y = function(e) {
          var n = e.node;
          return s.a.createElement(
            g.a,
            { to: n.fields.slug },
            s.a.createElement(
              v,
              null,
              s.a.createElement(w, null, n.frontmatter.title),
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
      y.propTypes = {
        node: f.a.shape({
          id: f.a.string.isRequired,
          frontmatter: f.a.shape({
            title: f.a.string.isRequired,
            date: f.a.string.isRequired
          }),
          fields: f.a.shape({ slug: f.a.string.isRequired }),
          excerpt: f.a.string.isRequired
        })
      };
      var _ = y;
      function b() {
        var e = l()(["\n    margin: 3rem 0 0;\n  "]);
        return (
          (b = function() {
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
          componentId: "sc-8fp4vw-0"
        })(
          ["font-weight:800;font-size:2.6rem;margin:6rem 0 0;", ""],
          h.a.phone(b())
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
                s.a.createElement(p.a, {
                  title: "All Posts",
                  keywords: ["gatsby", "blog", "react"]
                }),
                s.a.createElement(c.a, null),
                s.a.createElement(
                  "main",
                  null,
                  s.a.createElement(k, null, "Latest Posts"),
                  e.map(function(e) {
                    var n = e.node;
                    return s.a.createElement(_, { key: n.id, node: n });
                  })
                )
              );
            }),
            n
          );
        })(o.Component),
        q = ((n.default = R), "610401232");
    }
  }
]);
//# sourceMappingURL=component---src-pages-index-js-9b41fa44bd3a5c6a184d.js.map
