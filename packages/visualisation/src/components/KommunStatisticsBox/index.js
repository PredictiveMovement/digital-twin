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

const KommunStatisticsBox = ({
  name,
  totalBookings,
  totalCars,
  totalCargo,
  totalCo2,
  totalCapacity,
  averageDeliveryTime,
  averageCost,
  totalDelivered,
  totalQueued,
  averageQueued,
  averageUtilization,
}) => {
  return (
    <Wrapper>
      <H4>{name}</H4>
      <GridWrapper>
        <Grid>
          <ParagraphBold black>Antal fordon</ParagraphBold>
          <Paragraph black>{totalCars} fordon</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>Total kapacitet</ParagraphBold>
          <Paragraph black>{totalCapacity} personer</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>
            CO<sub>2</sub>
          </ParagraphBold>
          <Paragraph black>{totalCo2} kg</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>Genomsnittskostnad</ParagraphBold>
          <Paragraph black>{averageCost} kr/resenär</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>Medelfyllnadsgrad per bil</ParagraphBold>
          <Paragraph black>{averageUtilization}%</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>Genomsnittlig restid</ParagraphBold>
          <Paragraph black>
            {Math.ceil(averageDeliveryTime / 60) || 0} min
          </Paragraph>
        </Grid>
      </GridWrapper>
    </Wrapper>
  )
}

export default KommunStatisticsBox
