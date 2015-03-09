my @years = (2014, 2015);

my @week_start;
$week_start[2014] = 1;
$week_start[2015] = 1;

my @week_end;
$week_end[2014] = 52;
$week_end[2015] = 11;

for (my $i = 0; $i <= $#years; $i++) {
	my $year = $years[$i];
	for (my $j = $week_start[$year]; $j <= $week_end[$year]; $j++) {
		print "$year $j\n";
		my $url = "\"http://54.64.168.41:3000/chart/billboard?week=$j&year=$year\"";
		system("curl $url");
	}
}
