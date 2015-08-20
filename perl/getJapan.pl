use DateTime;

my $end = 2015;

my $date = DateTime->today();

if ($#ARGV >= 0 && $date->year() != $ARGV[0]) {
	my $start = $ARGV[0];
	$date = DateTime->new(year => $start, month => 12, day => 31);
	$end = $start;
}

if ($#ARGV >= 1) {
	$end = $ARGV[1];
}

if ($date->day_of_week() < 4) {
	$date->truncate( to => 'week' )->subtract( weeks => 2);
} else {
	$date->truncate( to => 'week' )->subtract( weeks => 1);
}
$date->add( days => 5 );

while ($date->year >= $end) {
	my $yy = $date->year;
	my $mm = $date->month;
	my $dd = $date->day;
	
	print $date->ymd(), "\n";

	my $url = "\"http://54.64.168.41:3000/chart/japan?year=$yy&month=$mm&day=$dd\"";
	system("curl $url > /dev/null 2>&1");

	$date->subtract( weeks => 1);
}
