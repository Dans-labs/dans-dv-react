import Typography from '@mui/material/Typography';

export function TabHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <>
        <Typography variant="h5" gutterBottom>{title}</Typography>
        <Typography mb={4}>{subtitle}</Typography>
    </>
  );
}

export function SubHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" mb={1}>{subtitle}</Typography>
    </>
  );
}