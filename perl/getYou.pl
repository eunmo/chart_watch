use DateTime;

my $end = 2015;

my $script = '/home/eunmo/dev/chart_watch/perl/you.pl';
my $chart_dir = '/home/eunmo/dev/chart_watch/chart';
my $html_dir = '/home/eunmo/dev/chart_watch/perl/html';

my $date = DateTime->today();

if ($#ARGV >= 0 && $date->year() != $ARGV[0]) {
	my $start = $ARGV[0];
	$date = DateTime->new(year => $start, month => 12, day => 31);
	$end = $start;
}

if ($#ARGV >= 1) {
	$end = $ARGV[1];
}

if ($date->day_of_week() < 2) {
	$date->truncate( to => 'week' )->subtract( weeks => 2);
} else {
	$date->truncate( to => 'week' )->subtract( weeks => 1);
}
$date->add( days => 5 );

my $file_date = $date->clone()->add( days => 9);

while ($date->year >= $end) {
	my $ymd = $file_date->ymd('');
	my $html_path = "$html_dir/$ymd-1.html";
	my $file_name = $date->ymd('.');
	my $file_path = "$chart_dir/o.$file_name";
	
	print $date->ymd(), "\t(", $ymd, ")";
	if (-e $html_path) {
		system "perl $script $html_dir/$ymd > $file_path";
		print "\t->\t$file_path\n";
	} elsif (-s $file_path > 6000) {
		print "\n";
	} else {
		my $file_ymd = $file_date->ymd(' ');
		system "/bin/bash oricon.sh $file_ymd";
		system "perl $script $html_dir/$ymd > $file_path";
		print "\t$file_ym\n";

		sleep (20);
	}

	$date->subtract( weeks => 1);
  $file_date = $date->clone()->add( days => 9);
}
