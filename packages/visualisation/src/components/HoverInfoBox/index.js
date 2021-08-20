import React from 'react'
import styled from 'styled-components'
import moment from 'moment';
import ProgressBar from '../ProgressBar'
import { Paragraph } from '../Typography';


const Wrapper = styled.div`
position: absolute;
left: ${props => props.left - 50}px;
top: ${props => props.top - 150}px;
background-color: #10C57B;
min-width: 200px;
min-height: 100px;
padding: 1.1rem;
border-radius: 4px;
justify-content: space-between;
z-index: 1;

:after {
    z-index: -1;
    position: absolute;
    top: 98.1%;
    left: 43%;
    margin-left: -25%;
    content: '';
    width: 0;
    height: 0;
    border-top: solid 10px #10C57B;
    border-left: solid 10px transparent;
    border-right: solid 10px transparent;
}
`


const CarInfo = ({ data }) => {
  return (
    <Wrapper left={data.x - 8} top={data.y - 40}>
      <div>
        <Paragraph>{`Lastbil ${data.id}`}</Paragraph>
        <Paragraph>Åkeri Jönsson</Paragraph>
        <Paragraph>Kör för DHL</Paragraph>
      </div>
      <div>
        <Paragraph>Fyllnadsgrad per bil:</Paragraph>
        <ProgressBar completed={100} />
      </div>
    </Wrapper>
  )
}

const HoverInfoBox = ({ data }) => {

  const formatDate = (date) => {
    const correctFormat = moment(date).format('HH:mm, DD/MM');
    return correctFormat
  }

  return (
    <>
      {data.type === 'car' ? (
        <CarInfo data={data} />
      ) : (
        <Wrapper left={data.x} top={data.y}>
          <Paragraph>{data.title}</Paragraph>
          <Paragraph>{data.subTitle}</Paragraph>

          {data.queuedDateTime &&
            <Paragraph> Queued: {formatDate(data.queuedDateTime)} </Paragraph>
          }
          {data.assignedDateTime &&
            <Paragraph>Assigned: {formatDate(data.assignedDateTime)}</Paragraph>
          }
          {data.pickupDateTime &&
            <Paragraph>Picked up: {formatDate(data.pickupDateTime)}</Paragraph>
          }
          {data.deliveredDateTime &&
            <Paragraph>Delivered: {formatDate(data.deliveredDateTime)}</Paragraph>
          }
        </Wrapper>
      )}
    </>
  )
}

export default HoverInfoBox