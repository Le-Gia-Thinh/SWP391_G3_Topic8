const fs = require('fs');
const path = require('path');

const driverHomePath = path.join(__dirname, '../FE/src/pages/driver/DriverHome.jsx');
let content = fs.readFileSync(driverHomePath, 'utf8');

const components = [
  'VehicleStatusCard',
  'QuickActionCard',
  'InfoRow',
  'BookingCard',
  'ActiveSessionCard',
  'EmptyCard',
  'SummaryMiniCard'
];

components.forEach(comp => {
  const searchStr1 = `const ${comp} = ({`;
  const searchStr2 = `const ${comp} = (props) => {`;
  
  // Regex to find the component definition
  const regex = new RegExp(`const ${comp} = \\(([^)]*)\\) => \\{\\n`);
  
  if (regex.test(content)) {
    content = content.replace(regex, `const ${comp} = ($1) => {\n  const { t } = useTranslation()\n`);
  }
});

fs.writeFileSync(driverHomePath, content);
console.log("Injected useTranslation to subcomponents");
