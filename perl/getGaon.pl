use DateTime;

my $date = DateTime->today();

if ($date->day_of_week() < 4) {
	$date->truncate( to => 'week' )->subtract( weeks => 2);
} else {
	$date->truncate( to => 'week' )->subtract( weeks => 1);
}
$date->add( days => 5 );

while ($date->year >= 2010) {
	my $yy = $date->year;
	my $mm = $date->month;
	my $dd = $date->day;
	
	print $date->ymd(), "\n";

	my $url = "\"http://54.64.168.41:8080/chart/gaon?year=$yy&month=$mm&day=$dd\"";
	system("curl $url");

	$date->subtract( weeks => 1);
}
