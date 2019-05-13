import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

import StyledLink from "../utils/styled-link";
import media from "../utils/media";
import Twitter from "../images/social/twitter.svg";
import Github from "../images/social/github.svg";

const Container = styled.nav`
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.05);
  height: 6rem;
  display: flex;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 0.1rem;
  text-transform: uppercase;
  margin: 0 auto 0 24px;

  ${media.phone`
    text-align: center;
  `}
`;

const Icon = styled.img`
  height: 2.5rem;
  width: 2.5rem;
  padding: 1.5rem 1rem;
  margin-right: 24px;
`;

const Header = ({ title }) => (
  <Container>
    <StyledLink to={"/"}>
      <Title>{title}</Title>
    </StyledLink>
    <a
      style={{ marginLeft: "auto" }}
      href={`https://twitter.com/intelligibabble`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon src={Twitter} alt="twitter" />
    </a>
    <a
      href={`https://github.com/lelandrichardson`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon src={Github} alt="github" />
    </a>
  </Container>
);

Header.defaultProps = {
  title: ""
};

Header.propTypes = {
  title: PropTypes.string
};

export default Header;
