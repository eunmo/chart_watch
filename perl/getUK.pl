use DateTime;

my $end = 2000;
my $port = 3000;

my $date = DateTime->today();

if ($#ARGV >= 0 && $date->year() != $ARGV[0]) {
	my $start = $ARGV[0];
	$date = DateTime->new(year => $start, month => 12, day => 31) if $start < $date->year;
	$end = $start;
}

if ($#ARGV >= 1) {
	$end = $ARGV[1];
}

$date->truncate( to => 'week' )->subtract( weeks => 1);
$date->add( days => 5 );

while ($date->year >= $end) {
	my $yy = $date->year;
	my $mm = $date->month;
	my $dd = $date->day;
	
	print $date->ymd(), "\n";

	my $url = "\"http://54.64.168.41:$port/chart/uk?year=$yy&month=$mm&day=$dd\"";
	system("curl $url > /dev/null 2>&1");

	$date->subtract( weeks => 1);
}
