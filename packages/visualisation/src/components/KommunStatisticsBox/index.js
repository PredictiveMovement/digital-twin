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
  height: 180px;
  justify-content: space-between;
  z-index: 1;
  width: 250px;
`

const KommunStatisticsBox = ({
  name,
  totalVehicles,
  totalBookings,
  totalCapacity,
  totalCo2,
  averageDeliveryTime,
  totalDelivered,
  averageUtilization,
  totalCargo,
  totalQueued,
  averageQueued,
  totalCost,
  averageCost,
}) => {
  return !totalVehicles ? null : (
    <Wrapper>
      <div>
        <Paragraph>
          {totalVehicles} fordon i {name}
        </Paragraph>
        <Paragraph>Total kapacitet: {totalCapacity} kollin</Paragraph>
        <Paragraph>Antal bokningar: {totalBookings} kollin</Paragraph>
        <Paragraph>Köat: {totalQueued} kollin</Paragraph>
        <Paragraph>Lastat: {totalCargo} kollin</Paragraph>
        {<Paragraph>CO2: {Math.round(totalCo2 * 10) / 10} kg</Paragraph>}
        <Paragraph>
          Levererade: {totalDelivered} kollin (
          {Math.round((totalDelivered / totalBookings) * 100)}%)
        </Paragraph>
        <Paragraph>
          Medel leveranstid: {secondsToHm(averageDeliveryTime)}{' '}
        </Paragraph>

        <Paragraph>Genomsnittskostnad: {averageCost}kr </Paragraph>
        <Paragraph>Totalkostnad: {totalCost}kr </Paragraph>

        {/* <Paragraph>Total cargo: {totalCargo}</Paragraph> */}
        {/* <Paragraph>Co2: XXX</Paragraph> */}
        {/* <Paragraph>Antal kollin upphämtade från avlastningscentralen: {bookingsFromHub} st</Paragraph> */}
      </div>
      {/* <div> */}
      {<ProgressBar completed={Math.round(averageUtilization * 100)} />}
      {/* </div> */}
    </Wrapper>
  )
}

const secondsToHm = (d) => {
  d = Number(d)
  const h = Math.floor(d / 3600)
  const m = Math.floor((d % 3600) / 60)

  const hours = h > 0 ? h + (h === 1 ? ' t ' : ' t ') : ''
  const minutes = m > 0 ? m + (m === 1 ? ' min ' : ' min ') : ''
  return hours + minutes
}

export default KommunStatisticsBox
