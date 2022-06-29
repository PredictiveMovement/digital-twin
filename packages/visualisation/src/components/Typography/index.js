import styled from 'styled-components'

const Paragraph = styled.p`
  margin: 0;
  font-weight: ${(props) => (props.thin ? 300 : 400)};
  font-size: 12px;
  font-family: 'Roboto', sans-serif;
  color: ${(props) => (props.black ? 'black' : 'white')};
`

const ParagraphBold = styled(Paragraph)`
  font-weight: bold;
`

const ParagraphLarge = styled.p`
  font-family: 'Roboto', sans-serif;
  color: #ffff;
  margin: 0;
  font-size: 16px;
`

const H1 = styled.h1`
  font-size: 20px;
  margin: 0;
`

const H2 = styled.h2`
  font-size: 18px;
  margin: 0;
`

const H3 = styled.h3`
  font-size: 14px;
  margin: 0;
`

const H4 = styled.h4`
  color: white;
  margin: 0;
  color: black;
  font-size: 14px;
`

const H5 = styled.h5`
  margin: 0;
  color: black;
`

export { Paragraph, ParagraphBold, ParagraphLarge, H1, H2, H3, H4, H5 }
