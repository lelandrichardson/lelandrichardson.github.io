import React, { Component } from "react";
import PropTypes from "prop-types";
import styled, { createGlobalStyle } from "styled-components";
import { StaticQuery, graphql } from "gatsby";

import Header from "./header";
import media from "../utils/media";

const GlobalStyles = createGlobalStyle`
  @font-face {
    font-family: system;
    font-style: normal;
    font-weight: 300;
    src: local('.SFNSText-Light'), local('.HelveticaNeueDeskInterface-Light'),
      local('.LucidaGrandeUI'), local('Ubuntu Light'), local('Segoe UI Light'),
      local('Roboto-Light'), local('DroidSans'), local('Tahoma');
  }

  :root {
    font-size: 10px;
  }

  body {
    font-family: Verdana;
    margin: 0;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    color: rgba(0, 0, 0, 0.8);
    min-height: 100vh;
    position: relative;
    font-size: 1.9rem;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Oswald', sans-serif;
  }

  h2 {
    font-size: 2.5rem;
  }

  h3 {
    font-size: 2.4rem;
  }

  h4 {
    font-size: 1.9rem;
  }
  
  code {
    font-family: Menlo,Monaco,"Courier New",Courier,monospace;
    word-break: break-word;
  }

  code[class*="language-"], pre[class*="language-"] {
    line-height: 1.3;
  }

  pre code {
    word-break: normal;
    font-size: 1.4rem;
  }

  :not(pre) > code[class*="language-"] {
    background-color: #eaeaea;
    padding: .1em 0.5em;
    border-radius: .2em;
    color: #8a4519;
    font-size: smaller;
    line-height: 1.6;
  }


  .table {
    width: 100%;
    border: 1px solid #222;
    border-spacing: 0;
    border-collapse: collapse;
    font-size: 1.4rem;
  }

  .table td, .table th {
    padding: 4px;
    vertical-align: top;
    border-top: 1px solid #222;
    border: 1px solid #222;
  }

  .table thead th {
    vertical-align: bottom;
    border-bottom: 2px solid #222;
  }


  .remark-code-title {
    margin-bottom: -8px;
    padding: 0.5em 1em;
    font-family: Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace;

    background-color: #464646;
    color: white;
    z-index: 0;

    border-top-left-radius: 0.3em;
    border-top-right-radius: 0.3em;
  }

  twitter-widget {
    margin: 10px auto;
  }
`;

const Footer = styled.footer`
  display: block;
  height: 6rem;
`;

const Content = styled.div`
  width: 60%;
  max-width: 728px;
  margin: 0 auto;

  ${media.tablet`
    width: 80%;
  `}
`;

class Layout extends Component {
  render() {
    const { children } = this.props;
    return (
      <StaticQuery
        query={graphql`
          query SiteTitleQuery {
            site {
              siteMetadata {
                title
              }
            }
          }
        `}
        render={data => (
          <>
            <Header title={data.site.siteMetadata.title} />
            <Content>{children}</Content>
            <Footer />
            <GlobalStyles />
          </>
        )}
      />
    );
  }
}

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;
