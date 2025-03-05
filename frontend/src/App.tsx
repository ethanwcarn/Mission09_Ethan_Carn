import "./App.css";
import teamsData from "./CollegeBasketballTeams.json"; // Import JSON

// Extract the array inside the "teams" object
const teams = teamsData.teams;

function Welcome() {
  return <h1>College Basketball Teams</h1>;
}

function TeamList() {
  return (
    <>
      {teams.map((team) => (
        <Team key={team.tid} {...team} />
      ))}
    </>
  );
}

function Team({
  school,
  name,
  city,
  state,
}: {
  school: string;
  name: string;
  city: string;
  state: string;
}) {
  return (
    <>
      <h2>School Name: {school}</h2>
      <h3>Mascot: {name}</h3>
      <h3>
        Location: {city}, {state}
      </h3>
      <br></br>
    </>
  );
}

function App() {
  return (
    <>
      <Welcome />
      <TeamList />
    </>
  );
}

export default App;
