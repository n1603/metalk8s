import React from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { intl } from '../translations/IntlGlobalProvider';

const Title = styled.h3`
  margin-top: 25px;
`;

const AboutContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 30px;
  flex-direction: column;
  align-items: center;
  color: ${(props) => props.theme.brand.textPrimary};
`;

const About = (props) => {
  const clusterVersion = useSelector((state) => state.app.nodes.clusterVersion);
  return (
    <AboutContainer>
      <Title>{intl.translate('product_name')}</Title>
      {`${intl.translate('cluster_version')}: ${clusterVersion}`}
    </AboutContainer>
  );
};

export default About;
