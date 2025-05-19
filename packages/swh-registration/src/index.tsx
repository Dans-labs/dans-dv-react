import { useApiToken } from "@dans-dv/wrapper";

export default function Form() {
  const { apiToken } = useApiToken();
  return (
    <div>
      <h1>Software Heritage Registration Form</h1>
      <p>This is a placeholder for the Software Heritage registration form.</p>
      {apiToken}
    </div>
  );
}