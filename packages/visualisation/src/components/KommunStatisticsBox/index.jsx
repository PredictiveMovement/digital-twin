import React from 'react'
import styled from 'styled-components'
import { Paragraph, H4, ParagraphBold } from '../Typography'

const Wrapper = styled.div`
  position: absolute;
  right: 3rem;
  top: 6rem;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  padding: 1.5rem;
  color: #000;
  border-radius: 6px;
  z-index: 1;
`

const Grid = styled.div`
  display: grid;
  gap: 1.2rem;
  grid-template-columns: 3fr 2fr;
`

const GridWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1.5rem;
`

const getTitle = (key) => {
  switch (key) {
    case 'totalCars':
      return 'Antal fordon'
    case 'totalCo2':
      return 'CO₂'
    case 'totalPassengerCapacity':
    case 'totalParcelCapacity':
      return 'Total kapacitet'
    case 'averageDeliveryTime':
      return 'Genomsnittlig restid'
    case 'averageParcelDeliveryTime':
      return 'Genomsnittlig leveranstid'
    case 'averageCost':
    case 'averageParcelCost':
      return 'Genomsnittskostnad'
    case 'averagePassengerLoad':
    case 'averageParcelLoad':
      return 'Medelfyllnadsgrad per fordon'
    case 'totalDelivered':
      return 'Totalt levererade'
    default:
      return ''
  }
}
const getUnit = (key) => {
  switch (key) {
    case 'totalCars':
      return 'fordon'
    case 'totalCo2':
      return 'kg'
    case 'totalPassengerCapacity':
      return 'personer'
    case 'totalParcelCapacity':
      return 'paket'
    case 'averagePassengerDeliveryTime':
    case 'averageParcelDeliveryTime':
      return 'min'
    case 'averagePassengerCost':
      return 'kr/resenär'
    case 'averageParcelCost':
      return 'kr/paket'
    case 'averagePassengerLoad':
    case 'averageParcelLoad':
      return '%'
    case 'totalDelivered':
      return 'st'
    default:
      return ''
  }
}
const KommunStatisticsBox = (stats) => (
  <Wrapper>
    <H4>{stats.name}</H4>
    <GridWrapper>
      {[
        'totalCars',
        'totalCo2',
        'totalParcelCapacity',
        'totalPassengerCapacity',
        'averagePassengerDeliveryTime',
        'averageParcelDeliveryTime',
        'averagePassengerCost',
        'averageParcelCost',
        'averagePassengerLoad',
        'averageParcelLoad',
        'totalDelivered',
      ].map((key) =>
        stats[key] ? (
          <Grid key={key}>
            <ParagraphBold key={1} black>{getTitle(key)}</ParagraphBold>
            <Paragraph key={2} black>
              {Math.round(stats[key] * 100) / 100} {getUnit(key)}
            </Paragraph>
          </Grid>
        ) : (
          <> </>
        )
      )}
    </GridWrapper>
  </Wrapper>
)

export default KommunStatisticsBox
