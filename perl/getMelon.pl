my @years = (2010, 2011, 2012, 2013, 2014, 2015);

my @week_start;
$week_start[2010] = 2;
$week_start[2011] = 1;
$week_start[2012] = 0;
$week_start[2013] = 0;
$week_start[2014] = 1;
$week_start[2015] = 1;

my @week_end;
$week_end[2010] = 52;
$week_end[2011] = 52;
$week_end[2012] = 51;
$week_end[2013] = 53;
$week_end[2014] = 52;
$week_end[2015] = 9;

for (my $i = 0; $i <= $#years; $i++) {
	my $year = $years[$i];
	for (my $j = $week_start[$year]; $j <= $week_end[$year]; $j++) {
		print "$year $j\n";
		my $url = "\"http://54.64.168.41:8080/chart/melon?week=$j&year=$year\"";
		system("curl $url");
	}
}
