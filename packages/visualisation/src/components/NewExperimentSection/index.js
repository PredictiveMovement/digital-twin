import Slider from '@mui/material/Slider'
import styled from 'styled-components'
import { H1, Paragraph } from '../Typography'

const MenuContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 300px;
  background-color: white;
  position: absolute;
  bottom: 0;
  left: 3.8rem;
  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 2.5rem;
  top: 0;
  z-index: 4;
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`

const FlexSpaceBetween = styled.div`
  display: flex;
  justify-content: space-between;
`

const StyledButton = styled.button`
  width: 140px;
  height: 40px;
  background-color: #10c57b;
  border: none;
  z-index: 2;
  cursor: pointer;
  font-size: 14px;
  font-family: Arial, Helvetica, sans-serif;
  border-radius: 2px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`

const NewExperimentSection = ({
  newParameters,
  newExperiment,
  setNewParameters,
}) => {
  const onChange = (e) => {
    setNewParameters({ ...newParameters, fixedRoute: e.target.value })
  }

  return (
    <MenuContainer>
      <Wrapper>
        <H1>Nytt experiement</H1>

        <Paragraph black>
          Här kan starta ett nytt experiment, välj hur många fasta vs dynamiska
          rutter du vill ha.
        </Paragraph>
        <Form>
          <div style={{ marginBottom: '0.5rem', marginTop: '-0.7rem' }}>
            <Slider
              aria-label="Custom marks"
              size="small"
              value={newParameters.fixedRoute}
              onChange={onChange}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}%`}
            />
            <FlexSpaceBetween>
              <Paragraph black small>
                Fasta
              </Paragraph>
              <Paragraph black small>
                Dynamiska
              </Paragraph>
            </FlexSpaceBetween>
          </div>
          <StyledButton type="submit" onClick={newExperiment}>
            Nytt experimentet
          </StyledButton>
        </Form>
      </Wrapper>
    </MenuContainer>
  )
}

export default NewExperimentSection
