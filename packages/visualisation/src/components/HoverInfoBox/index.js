import React from 'react'
import styled from 'styled-components'
import ProgressBar from '../ProgressBar'
import { Paragraph } from '../Typography'

const Wrapper = styled.div`
  position: absolute;
  left: ${(props) => props.left - 50}px;
  top: ${(props) => props.top - 115}px;
  background-color: #10c57b;
  min-width: 200px;
  min-height: 60px;
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
    border-top: solid 10px #10c57b;
    border-left: solid 10px transparent;
    border-right: solid 10px transparent;
  }
`

const CarInfo = ({ data }) => {
  return (
    <Wrapper left={data.x - 8} top={data.y - 80}>
      <div>
        <Paragraph>{`Fordon ${data.id}`}</Paragraph>
        <Paragraph>Kör för {data.fleet}</Paragraph>
        <Paragraph>Köat: {data.queue || 0} paket</Paragraph>
        <Paragraph>Co2: {data.co2 || 0} kg</Paragraph>
        <Paragraph>Lastat: {data.cargo} paket</Paragraph>
        <Paragraph>Kapacitet: {data.capacity} paket</Paragraph>
      </div>
      <div>
        <Paragraph>Fyllnadsgrad:</Paragraph>
        <ProgressBar
          completed={(100 * Math.round((data.cargo * 10) / data.capacity)) / 10}
        />
      </div>
    </Wrapper>
  )
}

const HoverInfoBox = ({ data }) => {
  return (
    <>
      {data.type === 'car' ? (
        <CarInfo data={data} />
      ) : (
        <Wrapper left={data.x} top={data.y - 40}>
          <Paragraph>{data.title}</Paragraph>
          <Paragraph>{data.subTitle}</Paragraph>
          {data.deliveryTime ? (
            <Paragraph>
              Leveranstid: {Math.ceil((10 * data.deliveryTime) / 60 / 60) / 10}{' '}
              h
            </Paragraph>
          ) : null}
          {data.co2 ? (
            <Paragraph>CO2: {Math.ceil(10 * data.co2) / 10} kg</Paragraph>
          ) : null}
          {data.cost ? (
            <Paragraph>
              Schablonkostnad: {Math.ceil(10 * data.cost) / 10} kr
            </Paragraph>
          ) : null}
        </Wrapper>
      )}
    </>
  )
}

export default HoverInfoBox
