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

const KommunStatisticsBox = ({ name, co2 }) => {
  return (
    <Wrapper>
      <H4>{name}</H4>
      <GridWrapper>
        <Grid>
          <ParagraphBold black>Antal fordon</ParagraphBold>
          <Paragraph black>xxxx fordon</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>Total kapacitet</ParagraphBold>
          <Paragraph black>xxxx personer</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>
            CO<sub>2</sub>
          </ParagraphBold>
          <Paragraph black>{co2} kg</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>Genomsnittskostnad</ParagraphBold>
          <Paragraph black>xxxx kr/resenär</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>Medelfyllnadsgrad per bil</ParagraphBold>
          <Paragraph black>xx%</Paragraph>
        </Grid>
        <Grid>
          <ParagraphBold black>Genomsnittlig restid</ParagraphBold>
          <Paragraph black>xxxx</Paragraph>
        </Grid>
      </GridWrapper>
    </Wrapper>
  )
}

export default KommunStatisticsBox
