import React from 'react'
import styled from 'styled-components'
import ProgressBar from '../ProgressBar'
import { Paragraph } from '../Typography'

const Wrapper = styled.div`
  position: absolute;
  top: 36px;
  left: 36px;
  display: flex;
  flex-direction: column;
  justify-content: space-space-between;
  background-color: #10c57b;
  padding: 1.7rem;
  border-radius: 4px;
  height: 158px;
  justify-content: space-between;
  z-index: 1;
  width: 250px;
`

const KommunStatisticsBox = ({
  name,
  totalCars,
  totalBookings,
  totalCapacity,
  totalUtilization,
  bookingsFromHub,
  totalCargo,
}) => {
  return (
    <Wrapper>
      <div>
        <Paragraph>
          Just nu kör {totalCars} lastbilar i {name}
        </Paragraph>
        <Paragraph>Total kapacitet: {totalCapacity}</Paragraph>
        <Paragraph>Total cargo: {totalCargo}</Paragraph>
        {/* <Paragraph>Total cargo: {totalCargo}</Paragraph> */}
        <Paragraph>Antal bokningar: {totalBookings} st</Paragraph>
        {/* <Paragraph>Co2: XXX</Paragraph> */}
        {/* <Paragraph>Antal paket upphämtade från avlastningscentralen: {bookingsFromHub} st</Paragraph> */}
      </div>
      <div>
        <Paragraph thin>Medelfyllnadsgrad per bil:</Paragraph>
        <ProgressBar completed={Math.round(totalUtilization * 100)} />
      </div>
    </Wrapper>
  )
}

export default KommunStatisticsBox
