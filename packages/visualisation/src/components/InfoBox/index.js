import React from 'react'
import styled from 'styled-components'
import ProgressBar from '../ProgressBar'
import Paragraph from '../Typography'

const Wrapper = styled.div`
  position: absolute;
  left: ${(props) => props.left}px;
  top: ${(props) => props.top}px;
  background-color: #10c57b;
  padding: 1.1rem;
  border-radius: 4px;
  justify-content: space-between;
  z-index: 1;
`

const InfoBox = ({
  title = 'Lastbil',
  subTitle = 'Åkeri Jönsson',
  fleet = 'Kör för DHL',
}) => {
  return (
    <Wrapper left={20} top={50}>
      <Paragraph>{title}</Paragraph>
      <Paragraph>{subTitle}</Paragraph>
      <Paragraph>{fleet}</Paragraph>
      <div>
        <Paragraph thin>Fyllnadsgrad:</Paragraph>
        <ProgressBar completed={60} />
      </div>
    </Wrapper>
  )
}

export default InfoBox
