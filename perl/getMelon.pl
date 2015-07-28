use DateTime;

my $date = DateTime->today();

$date->truncate( to => 'week' )->subtract( weeks => 1);
$date->add( days => 5 );

while ($date->year >= 2010) {
	my $yy = $date->year;
	my $mm = $date->month;
	my $dd = $date->day;
	
	print $date->ymd(), "\n";

	my $url = "\"http://54.64.168.41:3000/chart/melon?year=$yy&month=$mm&day=$dd\"";
	system("curl $url > /dev/null 2>&1");

	$date->subtract( weeks => 1);
}
